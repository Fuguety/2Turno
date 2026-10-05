package com.twelveaxes.service;

import com.twelveaxes.model.Axis;
import com.twelveaxes.model.AxisResult;
import com.twelveaxes.model.ElectionAnswerRequest;
import com.twelveaxes.model.ElectionComparison;
import com.twelveaxes.model.ElectionModel;
import com.twelveaxes.model.ElectionVectorRequest;
import com.twelveaxes.model.Pole;
import com.twelveaxes.model.Question;
import com.twelveaxes.model.SubmittedAnswer;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ElectionComparisonService
{
    private final ElectionDataService electionDataService;
    private final ScoringService scoringService;

    public ElectionComparisonService(ElectionDataService electionDataService, ScoringService scoringService)
    {
        this.electionDataService = electionDataService;
        this.scoringService = scoringService;
    }



    public ElectionComparison score(ElectionAnswerRequest request, String language)
    {
        electionDataService.validateModelIdentifier(request.modelId());
        ElectionModel model = electionDataService.getModel(language);
        Map<String, Long> answerCounts = validateAnswers(request, model);
        Map<String, Double> userVector = scoreVector(request.answers(), model, language);
        return compare(userVector, model, answerCounts, language);
    }



    public ElectionComparison compare(ElectionVectorRequest request, String language)
    {
        electionDataService.validateModelIdentifier(request.modelId());
        ElectionModel model = electionDataService.getModel(language);
        Set<String> axisIdentifiers = model.axes().stream().map(Axis::id).collect(Collectors.toSet());
        if (request.scores() == null || !request.scores().keySet().equals(axisIdentifiers)
                || request.scores().values().stream().anyMatch(value -> value == null
                || !Double.isFinite(value) || value < 0.0 || value > 100.0))
        {
            throw invalidAnswers("Informe os doze eixos eleitorais, com valores entre 0 e 100.");
        }
        return compare(request.scores(), model, Map.of(), language);
    }



    private Map<String, Long> validateAnswers(ElectionAnswerRequest request, ElectionModel model)
    {
        int questionsPerAxis = electionDataService.questionsPerAxis(request.variant());
        Map<String, Question> questionsByIdentifier = model.questions().stream()
                .collect(Collectors.toMap(Question::id, Function.identity()));
        Set<String> answeredIdentifiers = new HashSet<>();
        Set<String> answeredTopics = new HashSet<>();
        for (SubmittedAnswer answer : request.answers())
        {
            Question question = questionsByIdentifier.get(answer.questionId());
            if (question == null || answer.answer() == null || !question.core()
                    || !answeredIdentifiers.add(answer.questionId()) || !answeredTopics.add(question.topic()))
            {
                throw invalidAnswers("As respostas devem usar perguntas eleitorais distintas do núcleo do quiz.");
            }
        }
        Map<String, Long> counts = request.answers().stream().collect(Collectors.groupingBy(
                answer -> questionsByIdentifier.get(answer.questionId()).axisId(), Collectors.counting()));
        for (Axis axis : model.axes())
        {
            long count = counts.getOrDefault(axis.id(), 0L);
            long leftCount = request.answers().stream().filter(answer ->
            {
                Question question = questionsByIdentifier.get(answer.questionId());
                return question.axisId().equals(axis.id()) && question.agreePole() == Pole.LEFT;
            }).count();
            if (count != questionsPerAxis || Math.abs(2 * leftCount - count) > 1)
            {
                throw invalidAnswers("Responda o número previsto de perguntas por eixo, equilibrado entre os dois polos.");
            }
        }
        return Map.copyOf(counts);
    }



    private Map<String, Double> scoreVector(List<SubmittedAnswer> answers, ElectionModel model, String language)
    {
        return scoringService.scoreAnswers(answers, model.questions(), model.axes(), language).stream()
                .collect(Collectors.toMap(AxisResult::axisId, AxisResult::leftPercent));
    }



    private ElectionComparison compare(Map<String, Double> userVector, ElectionModel model,
            Map<String, Long> answerCounts, String language)
    {
        Map<String, Map<String, Double>> candidateVectors = new LinkedHashMap<>();
        for (ElectionModel.Candidate candidate : model.candidates())
        {
            List<SubmittedAnswer> answers = candidate.answers().entrySet().stream()
                    .map(answer -> new SubmittedAnswer(answer.getKey(), answer.getValue())).toList();
            candidateVectors.put(candidate.id(), scoreVector(answers, model, language));
        }
        Map<String, Double> distances = candidateVectors.entrySet().stream().collect(Collectors.toMap(
                Map.Entry::getKey, candidate -> distance(userVector, candidate.getValue(), model.axes())));
        double minimumDistance = distances.values().stream().mapToDouble(Double::doubleValue).min().orElseThrow();
        List<String> closest = model.candidates().stream()
                .filter(candidate -> Math.abs(distances.get(candidate.id()) - minimumDistance) < 0.0000001)
                .map(ElectionModel.Candidate::id).toList();
        List<ElectionComparison.CandidateMatch> candidates = model.candidates().stream()
                .sorted(Comparator.comparingDouble(candidate -> distances.get(candidate.id())))
                .map(candidate -> new ElectionComparison.CandidateMatch(candidate.id(), candidate.name(),
                        candidate.party(), candidate.number(), round(distances.get(candidate.id())),
                        round(100.0 - distances.get(candidate.id())))).toList();
        List<ElectionComparison.AxisComparison> axes = model.axes().stream().map(axis ->
        {
            Map<String, Double> scores = new LinkedHashMap<>();
            candidateVectors.forEach((identifier, vector) -> scores.put(identifier, vector.get(axis.id())));
            return new ElectionComparison.AxisComparison(axis, userVector.get(axis.id()), Map.copyOf(scores));
        }).toList();
        return new ElectionComparison(model.modelId(), model.asOf(), "mean-absolute-distance-v1",
                axes, candidates, closest, answerCounts);
    }



    private double distance(Map<String, Double> userVector, Map<String, Double> candidateVector, List<Axis> axes)
    {
        return axes.stream().mapToDouble(axis -> Math.abs(userVector.get(axis.id()) - candidateVector.get(axis.id())))
                .average().orElseThrow();
    }



    private double round(double value)
    {
        return Math.round(value * 10.0) / 10.0;
    }



    private ResponseStatusException invalidAnswers(String message)
    {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
