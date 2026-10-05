package com.twelveaxes.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twelveaxes.model.AnswerValue;
import com.twelveaxes.model.Axis;
import com.twelveaxes.model.ElectionModel;
import com.twelveaxes.model.Pole;
import com.twelveaxes.model.Question;
import com.twelveaxes.model.QuizPayload;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ElectionDataService
{
    private final ObjectMapper objectMapper;
    private final QuizDataService quizDataService;
    private ElectionModel portugueseModel;
    private ElectionModel englishModel;

    public ElectionDataService(ObjectMapper objectMapper, QuizDataService quizDataService)
    {
        this.objectMapper = objectMapper;
        this.quizDataService = quizDataService;
    }



    @PostConstruct
    public void load() throws IOException
    {
        portugueseModel = readResource("data/elections/brazil-2026.json", ElectionModel.class);
        validateModel(portugueseModel);
        ElectionModel.Translation translation = readResource(
                "data/i18n/en/elections/brazil-2026.json", ElectionModel.Translation.class);
        englishModel = translateModel(translation);
    }



    private <Value> Value readResource(String path, Class<Value> valueType) throws IOException
    {
        try (var input = new ClassPathResource(path).getInputStream())
        {
            return objectMapper.readValue(input, valueType);
        }
    }



    public ElectionModel getModel(String language)
    {
        return QuizDataService.LANG_EN.equals(QuizDataService.normalizeLang(language))
                ? englishModel : portugueseModel;
    }



    public void validateModelIdentifier(String modelIdentifier)
    {
        if (!portugueseModel.modelId().equals(modelIdentifier))
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use o identificador do modelo eleitoral atual; resultados de outro quiz não são compatíveis.");
        }
    }



    public int questionsPerAxis(String variant)
    {
        return switch (variant == null ? "" : variant)
        {
            case "short" -> 3;
            case "extended" -> 5;
            case "extreme" -> 6;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de quiz inválido.");
        };
    }



    public ElectionModel.Quiz getQuiz(String variant, String language)
    {
        ElectionModel model = getModel(language);
        int questionsPerAxis = questionsPerAxis(variant);
        QuizPayload quiz = new QuizPayload(model.title(), model.description(), variant,
                questionsPerAxis * model.axes().size(), "extreme".equals(variant) ? 0 : questionsPerAxis,
                model.axes(), model.questions(), quizDataService.getQuiz(variant, language).answerOptions(), List.of());
        return new ElectionModel.Quiz(model.modelId(), model.asOf(), quiz);
    }



    private void validateModel(ElectionModel model)
    {
        Set<String> axisIdentifiers = uniqueIdentifiers(model.axes().stream().map(Axis::id).toList());
        require(axisIdentifiers.size() == 12, "Exactly twelve election axes are required.");
        require(model.title() != null && !model.title().isBlank()
                && model.description() != null && !model.description().isBlank(), "Missing election text.");
        model.axes().forEach(axis -> require(axis.label() != null && !axis.label().isBlank()
                && axis.leftPole() != null && !axis.leftPole().isBlank()
                && axis.rightPole() != null && !axis.rightPole().isBlank(), "Missing election axis text."));
        require(model.modelId() != null && !model.modelId().isBlank(), "Election model identifier missing.");
        java.time.LocalDate.parse(model.asOf());
        Set<String> questionIdentifiers = uniqueIdentifiers(model.questions().stream().map(Question::id).toList());
        validateQuestions(model, axisIdentifiers);
        Set<String> sourceIdentifiers = uniqueIdentifiers(model.sources().stream().map(ElectionModel.Source::id).toList());
        model.sources().forEach(source -> require(source.url().startsWith("https://")
                && source.title() != null && !source.title().isBlank(), "Invalid election source."));
        Set<String> candidateIdentifiers = uniqueIdentifiers(model.candidates().stream()
                .map(ElectionModel.Candidate::id).toList());
        require(candidateIdentifiers.equals(Set.of("lula-da-silva", "flavio-bolsonaro")),
                "The election comparison requires Lula and Flávio Bolsonaro.");
        model.candidates().forEach(candidate -> validateCandidate(
                candidate, axisIdentifiers, questionIdentifiers, sourceIdentifiers));
    }



    private void validateQuestions(ElectionModel model, Set<String> axisIdentifiers)
    {
        uniqueIdentifiers(model.questions().stream().map(Question::topic).toList());
        for (Question question : model.questions())
        {
            require(axisIdentifiers.contains(question.axisId()), "Unknown election question axis.");
            require(question.id().startsWith("br2026_") && question.text() != null
                    && !question.text().isBlank(), "Invalid election question.");
            require(question.weight() == 1.0 && question.agreePole() != null,
                    "Election questions require unit weight and an explicit pole.");
        }
        for (String axisIdentifier : axisIdentifiers)
        {
            List<Question> questions = model.questions().stream()
                    .filter(question -> axisIdentifier.equals(question.axisId())).toList();
            require(questions.size() == 6, "Each election axis requires six distinct questions.");
            for (Pole pole : Pole.values())
            {
                require(questions.stream().filter(question -> question.core()
                        && question.agreePole() == pole).count() == 3,
                        "Each election axis requires three core questions per pole.");
            }
        }
    }



    private void validateCandidate(ElectionModel.Candidate candidate, Set<String> axisIdentifiers,
            Set<String> questionIdentifiers, Set<String> sourceIdentifiers)
    {
        require(candidate.answers().keySet().equals(questionIdentifiers), "Incomplete candidate answers.");
        require(candidate.evidence().keySet().equals(axisIdentifiers), "Incomplete candidate evidence.");
        uniqueIdentifiers(candidate.uncertainQuestionIds());
        for (String questionIdentifier : candidate.uncertainQuestionIds())
        {
            require(candidate.answers().get(questionIdentifier) == AnswerValue.NEUTRAL,
                    "Uncertain candidate answers must remain neutral.");
        }
        candidate.evidence().values().forEach(evidence ->
        {
            require(Set.of("low", "medium", "high").contains(evidence.confidence()), "Invalid confidence.");
            require(!evidence.sourceIds().isEmpty() && sourceIdentifiers.containsAll(evidence.sourceIds()),
                    "Unknown candidate evidence source.");
            require(evidence.summary() != null && !evidence.summary().isBlank()
                    && evidence.summaryEnglish() != null && !evidence.summaryEnglish().isBlank()
                    && evidence.locator() != null && !evidence.locator().isBlank(), "Missing evidence explanation.");
        });
    }



    private ElectionModel translateModel(ElectionModel.Translation translation)
    {
        Set<String> axisIdentifiers = uniqueIdentifiers(translation.axes().stream().map(Axis::id).toList());
        require(axisIdentifiers.equals(portugueseModel.axes().stream().map(Axis::id).collect(Collectors.toSet())),
                "Election axis translations are incomplete.");
        uniqueIdentifiers(translation.questions().stream().map(ElectionModel.QuestionText::id).toList());
        Map<String, ElectionModel.QuestionText> translatedQuestions = translation.questions().stream()
                .collect(Collectors.toMap(ElectionModel.QuestionText::id, Function.identity()));
        require(translatedQuestions.keySet().equals(portugueseModel.questions().stream()
                .map(Question::id).collect(Collectors.toSet())), "Election question translations are incomplete.");
        List<Question> questions = portugueseModel.questions().stream().map(question -> new Question(
                question.id(), question.axisId(), translatedQuestions.get(question.id()).text(),
                question.agreePole(), question.weight(), question.topic(), question.core())).toList();
        Map<String, Axis> translatedAxes = translation.axes().stream()
                .collect(Collectors.toMap(Axis::id, Function.identity()));
        List<Axis> axes = portugueseModel.axes().stream().map(axis -> translatedAxes.get(axis.id())).toList();
        ElectionModel result = new ElectionModel(portugueseModel.modelId(), portugueseModel.asOf(),
                translation.title(), translation.description(), axes, questions,
                portugueseModel.candidates().stream().map(this::translateCandidate).toList(), portugueseModel.sources());
        validateModel(result);
        return result;
    }



    private ElectionModel.Candidate translateCandidate(ElectionModel.Candidate candidate)
    {
        Map<String, ElectionModel.Evidence> evidence = candidate.evidence().entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry ->
                {
                    ElectionModel.Evidence original = entry.getValue();
                    return new ElectionModel.Evidence(original.confidence(), original.summaryEnglish(),
                            original.summaryEnglish(), original.sourceIds(), original.locator());
                }));
        return new ElectionModel.Candidate(candidate.id(), candidate.name(), candidate.party(), candidate.number(),
                candidate.answers(), candidate.uncertainQuestionIds(), evidence);
    }



    private Set<String> uniqueIdentifiers(List<String> identifiers)
    {
        require(identifiers.stream().allMatch(identifier -> identifier != null && !identifier.isBlank()),
                "Blank election identifier.");
        Set<String> unique = new HashSet<>(identifiers);
        require(unique.size() == identifiers.size(), "Duplicate election identifier or topic.");
        return unique;
    }



    private void require(boolean condition, String message)
    {
        if (!condition)
        {
            throw new IllegalStateException(message);
        }
    }
}
