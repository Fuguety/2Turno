package com.twelveaxes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twelveaxes.model.AnswerValue;
import com.twelveaxes.model.Axis;
import com.twelveaxes.model.AxisResult;
import com.twelveaxes.model.ElectionAnswerRequest;
import com.twelveaxes.model.ElectionComparison;
import com.twelveaxes.model.ElectionModel;
import com.twelveaxes.model.ElectionVectorRequest;
import com.twelveaxes.model.Pole;
import com.twelveaxes.model.Question;
import com.twelveaxes.model.SubmittedAnswer;
import com.twelveaxes.service.ElectionComparisonService;
import com.twelveaxes.service.ElectionDataService;
import com.twelveaxes.service.QuizDataService;
import com.twelveaxes.service.ScoringService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@AutoConfigureMockMvc
class ElectionComparisonTest
{
    @Autowired
    private ElectionDataService electionDataService;
    @Autowired
    private ElectionComparisonService comparisonService;
    @Autowired
    private ScoringService scoringService;
    @Autowired
    private QuizDataService quizDataService;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;

    @Test
    void bankHasTwelveDistinctAxesAndBalancedCoreTopics()
    {
        ElectionModel model = electionDataService.getModel("pt");
        assertThat(model.axes()).hasSize(12);
        assertThat(model.questions()).hasSize(72).allMatch(Question::core);
        assertThat(model.questions().stream().map(Question::id)).doesNotHaveDuplicates();
        assertThat(model.questions().stream().map(Question::topic)).doesNotHaveDuplicates();
        for (Axis axis : model.axes())
        {
            List<Question> questions = model.questions().stream()
                    .filter(question -> question.axisId().equals(axis.id())).toList();
            assertThat(questions).hasSize(6);
            assertThat(questions.stream().filter(question -> question.agreePole() == Pole.LEFT)).hasSize(3);
            assertThat(questions.stream().filter(question -> question.agreePole() == Pole.RIGHT)).hasSize(3);
        }
        assertThat(quizDataService.getQuestions()).hasSize(240);
        assertThat(model.questions().stream().map(Question::id))
                .doesNotContainAnyElementsOf(quizDataService.getQuestions().stream().map(Question::id).toList());
    }



    @ParameterizedTest
    @ValueSource(strings = {"short", "extended", "extreme"})
    void quizEndpointPreservesExistingSelectionContract(String variant) throws Exception
    {
        int expectedCount = electionDataService.questionsPerAxis(variant) * 12;
        mockMvc.perform(get("/api/elections/brazil-2026/quiz").param("variant", variant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelId").value("brazil-presidential-2026-v2"))
                .andExpect(jsonPath("$.quiz.questionCount").value(expectedCount))
                .andExpect(jsonPath("$.quiz.questions.length()").value(72))
                .andExpect(jsonPath("$.quiz.archetypeQuestions.length()").value(0));
    }



    @ParameterizedTest
    @ValueSource(strings = {"short", "extended"})
    void resultsAcceptBalancedShortAndExtendedSelections(String variant) throws Exception
    {
        ElectionModel model = electionDataService.getModel("pt");
        int questionsPerAxis = electionDataService.questionsPerAxis(variant);
        List<SubmittedAnswer> answers = new ArrayList<>();
        for (Axis axis : model.axes())
        {
            model.questions().stream().filter(question -> question.axisId().equals(axis.id()))
                    .limit(questionsPerAxis)
                    .map(question -> new SubmittedAnswer(question.id(), AnswerValue.NEUTRAL))
                    .forEach(answers::add);
        }
        mockMvc.perform(post("/api/elections/brazil-2026/results").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ElectionAnswerRequest(model.modelId(), variant, answers))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.axes.length()").value(12))
                .andExpect(jsonPath("$.axes[0].userScore").value(50.0))
                .andExpect(jsonPath("$.answeredQuestionCounts.coordenacao").value(questionsPerAxis));
    }



    @Test
    void localizationPreservesPoliticalScoresAndQuestionMetadata() throws Exception
    {
        ElectionModel portuguese = electionDataService.getModel("pt");
        ElectionModel english = electionDataService.getModel("en");
        assertThat(english.axes().stream().map(Axis::id))
                .containsExactlyElementsOf(portuguese.axes().stream().map(Axis::id).toList());
        for (int index = 0; index < portuguese.questions().size(); index++)
        {
            Question original = portuguese.questions().get(index);
            Question translated = english.questions().get(index);
            assertThat(translated.text()).isNotBlank().isNotEqualTo(original.text());
            assertThat(translated).usingRecursiveComparison().ignoringFields("text").isEqualTo(original);
        }
        ElectionComparison portugueseResult = scoreAll(AnswerValue.NEUTRAL, "pt");
        ElectionComparison englishResult = scoreAll(AnswerValue.NEUTRAL, "en");
        assertThat(englishResult.candidates()).isEqualTo(portugueseResult.candidates());
        assertThat(englishResult.closestCandidateIds()).isEqualTo(portugueseResult.closestCandidateIds());
        mockMvc.perform(get("/api/elections/brazil-2026/model").param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.axes[0].label").value("Economic coordination"))
                .andExpect(jsonPath("$.candidates[0].evidence.coordenacao.summary")
                        .value("Industrial policy with local content; simpler business rules; smooths fuel prices."));
    }



    @Test
    void oppositeAnswersMoveEveryAxisTowardOppositePoles()
    {
        ElectionModel model = electionDataService.getModel("pt");
        for (Pole chosenPole : Pole.values())
        {
            List<SubmittedAnswer> answers = model.questions().stream().map(question -> new SubmittedAnswer(
                    question.id(), question.agreePole() == chosenPole
                    ? AnswerValue.STRONGLY_AGREE : AnswerValue.STRONGLY_DISAGREE)).toList();
            ElectionComparison comparison = comparisonService.score(
                    new ElectionAnswerRequest(model.modelId(), "extreme", answers), "pt");
            assertThat(comparison.axes()).allSatisfy(axis ->
                    assertThat(axis.userScore()).isEqualTo(chosenPole == Pole.LEFT ? 100.0 : 0.0));
        }
    }



    @Test
    void neutralAndUniformAgreementProduceCenteredAxes()
    {
        assertThat(scoreAll(AnswerValue.NEUTRAL, "pt").axes())
                .allSatisfy(axis -> assertThat(axis.userScore()).isEqualTo(50.0));
        assertThat(scoreAll(AnswerValue.STRONGLY_AGREE, "pt").axes())
                .allSatisfy(axis -> assertThat(axis.userScore()).isEqualTo(50.0));
        assertThat(scoreAll(AnswerValue.STRONGLY_DISAGREE, "pt").axes())
                .allSatisfy(axis -> assertThat(axis.userScore()).isEqualTo(50.0));
    }



    @Test
    void candidateAnswersReproduceTheirProfilesAndMatchThemselvesExactly()
    {
        ElectionModel model = electionDataService.getModel("pt");
        Map<String, List<Double>> expectedVectors = Map.of(
                "lula-da-silva", List.of(75.0, 66.7, 79.2, 62.5, 79.2, 70.8, 58.3, 83.3, 75.0, 58.3, 87.5, 58.3),
                "flavio-bolsonaro", List.of(29.2, 45.8, 29.2, 16.7, 20.8, 33.3, 50.0, 16.7, 12.5, 20.8, 50.0, 33.3));
        for (ElectionModel.Candidate candidate : model.candidates())
        {
            List<SubmittedAnswer> answers = candidate.answers().entrySet().stream()
                    .map(answer -> new SubmittedAnswer(answer.getKey(), answer.getValue())).toList();
            ElectionComparison comparison = comparisonService.score(
                    new ElectionAnswerRequest(model.modelId(), "extreme", answers), "pt");
            assertThat(comparison.axes().stream().map(ElectionComparison.AxisComparison::userScore))
                    .containsExactlyElementsOf(expectedVectors.get(candidate.id()));
            assertThat(comparison.closestCandidateIds()).containsExactly(candidate.id());
            assertThat(comparison.candidates().getFirst().compatibility()).isEqualTo(100.0);
            assertThat(comparison.candidates().getFirst().distance()).isZero();
            assertThat(comparison.axes()).allSatisfy(axis ->
                    assertThat(axis.userScore()).isEqualTo(axis.candidateScores().get(candidate.id())));
        }
    }



    @Test
    void changingOneTopicAffectsOnlyItsAxisAndHasBoundedOverallImpact()
    {
        ElectionModel model = electionDataService.getModel("pt");
        List<SubmittedAnswer> answers = new ArrayList<>(neutralAnswers());
        Question changedQuestion = model.questions().getFirst();
        answers.set(0, new SubmittedAnswer(changedQuestion.id(), AnswerValue.STRONGLY_AGREE));
        ElectionComparison before = scoreAll(AnswerValue.NEUTRAL, "pt");
        ElectionComparison after = comparisonService.score(new ElectionAnswerRequest(model.modelId(), "extreme", answers), "pt");
        assertThat(after.axes().getFirst().userScore()).isEqualTo(58.3);
        assertThat(after.axes().subList(1, 12)).allSatisfy(axis -> assertThat(axis.userScore()).isEqualTo(50.0));
        Map<String, Double> beforeDistances = before.candidates().stream().collect(Collectors.toMap(
                ElectionComparison.CandidateMatch::id, ElectionComparison.CandidateMatch::distance));
        after.candidates().forEach(candidate -> assertThat(Math.abs(
                candidate.distance() - beforeDistances.get(candidate.id()))).isLessThanOrEqualTo(0.8));
    }



    @Test
    void eachLikertStepMovesOnlyTheIntendedAxisInTheCorrectDirection()
    {
        ElectionModel model = electionDataService.getModel("pt");
        for (Question question : model.questions())
        {
            double previous = question.agreePole() == Pole.LEFT ? 101.0 : -1.0;
            for (AnswerValue answer : AnswerValue.values())
            {
                List<AxisResult> result = scoringService.scoreAnswers(
                        List.of(new SubmittedAnswer(question.id(), answer)), model.questions(), model.axes(), "pt");
                double score = result.stream().filter(axis -> axis.axisId().equals(question.axisId()))
                        .findFirst().orElseThrow().leftPercent();
                if (question.agreePole() == Pole.LEFT)
                {
                    assertThat(score).isLessThan(previous);
                }
                else
                {
                    assertThat(score).isGreaterThan(previous);
                }
                assertThat(result.stream().filter(axis -> !axis.axisId().equals(question.axisId())))
                        .allSatisfy(axis -> assertThat(axis.leftPercent()).isEqualTo(50.0));
                previous = score;
            }
        }
    }



    @Test
    void equidistantUserReturnsBothCandidatesWithoutOrderingBias()
    {
        ElectionComparison center = scoreAll(AnswerValue.NEUTRAL, "pt");
        Map<String, Double> midpoint = center.axes().stream().collect(Collectors.toMap(
                axis -> axis.axis().id(), axis -> axis.candidateScores().values().stream()
                        .mapToDouble(Double::doubleValue).average().orElseThrow()));
        ElectionComparison comparison = comparisonService.compare(new ElectionVectorRequest(center.modelId(), midpoint), "pt");
        assertThat(comparison.closestCandidateIds()).containsExactlyInAnyOrder("lula-da-silva", "flavio-bolsonaro");
        assertThat(comparison.candidates().get(0).distance()).isEqualTo(comparison.candidates().get(1).distance());
        assertThat(comparison.answeredQuestionCounts()).isEmpty();
    }



    @Test
    void uncertainPositionsHaveNeutralAnswersAndEveryAxisHasTraceableEvidence()
    {
        ElectionModel model = electionDataService.getModel("pt");
        Set<String> sourceIdentifiers = model.sources().stream().map(ElectionModel.Source::id).collect(Collectors.toSet());
        model.candidates().forEach(candidate ->
        {
            assertThat(candidate.answers()).hasSize(72);
            assertThat(candidate.evidence()).hasSize(12);
            candidate.uncertainQuestionIds().forEach(identifier ->
                    assertThat(candidate.answers().get(identifier)).isEqualTo(AnswerValue.NEUTRAL));
            candidate.evidence().values().forEach(evidence ->
            {
                assertThat(evidence.sourceIds()).isNotEmpty().allMatch(sourceIdentifiers::contains);
                assertThat(evidence.locator()).isNotBlank();
            });
        });
    }



    @Test
    void resultsEndpointReturnsAllThreeScoresForEveryAxis() throws Exception
    {
        ElectionModel model = electionDataService.getModel("pt");
        mockMvc.perform(post("/api/elections/brazil-2026/results").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ElectionAnswerRequest(model.modelId(), "extreme", neutralAnswers()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scoringMethod").value("mean-absolute-distance-v1"))
                .andExpect(jsonPath("$.axes.length()").value(12))
                .andExpect(jsonPath("$.axes[0].userScore").value(50.0))
                .andExpect(jsonPath("$.axes[0].candidateScores.lula-da-silva").value(75.0))
                .andExpect(jsonPath("$.axes[0].candidateScores.flavio-bolsonaro").value(29.2))
                .andExpect(jsonPath("$.answeredQuestionCounts.coordenacao").value(6));
    }



    @Test
    void rejectsDuplicateUnknownMissingUnbalancedAndWrongModelAnswers() throws Exception
    {
        ElectionModel model = electionDataService.getModel("pt");
        List<SubmittedAnswer> duplicate = new ArrayList<>(neutralAnswers());
        duplicate.set(1, duplicate.get(0));
        List<SubmittedAnswer> unknown = new ArrayList<>(neutralAnswers());
        unknown.set(0, new SubmittedAnswer("economia_01", AnswerValue.NEUTRAL));
        List<SubmittedAnswer> unbalanced = model.questions().stream().filter(question -> question.agreePole() == Pole.LEFT)
                .map(question -> new SubmittedAnswer(question.id(), AnswerValue.NEUTRAL)).toList();
        List<ElectionAnswerRequest> requests = List.of(
                new ElectionAnswerRequest(model.modelId(), "extreme", duplicate),
                new ElectionAnswerRequest(model.modelId(), "extreme", unknown),
                new ElectionAnswerRequest(model.modelId(), "extreme", neutralAnswers().subList(0, 71)),
                new ElectionAnswerRequest(model.modelId(), "short", unbalanced),
                new ElectionAnswerRequest("general-12axes", "extreme", neutralAnswers()),
                new ElectionAnswerRequest(model.modelId(), "unknown", neutralAnswers()));
        for (ElectionAnswerRequest request : requests)
        {
            mockMvc.perform(post("/api/elections/brazil-2026/results").contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/elections/brazil-2026/results").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"modelId\":\"brazil-presidential-2026-v2\",\"variant\":\"short\",\"answers\":[null]}"))
                .andExpect(status().isBadRequest());
    }



    @Test
    void rejectsIncompleteLegacyOutOfRangeAndNonFiniteVectors() throws Exception
    {
        ElectionModel model = electionDataService.getModel("pt");
        Map<String, Double> centered = model.axes().stream().collect(Collectors.toMap(Axis::id, axis -> 50.0));
        for (Double invalidValue : new Double[]{-1.0, 101.0, Double.NaN, Double.POSITIVE_INFINITY, null})
        {
            Map<String, Double> vector = new HashMap<>(centered);
            vector.put(model.axes().getFirst().id(), invalidValue);
            assertThatThrownBy(() -> comparisonService.compare(new ElectionVectorRequest(model.modelId(), vector), "pt"))
                    .isInstanceOf(ResponseStatusException.class);
        }
        mockMvc.perform(post("/api/elections/brazil-2026/compare").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ElectionVectorRequest(model.modelId(), Map.of("economia", 50.0)))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/elections/brazil-2026/compare").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ElectionVectorRequest("obsolete-model", centered))))
                .andExpect(status().isBadRequest());
    }



    private ElectionComparison scoreAll(AnswerValue answer, String language)
    {
        ElectionModel model = electionDataService.getModel(language);
        List<SubmittedAnswer> answers = model.questions().stream()
                .map(question -> new SubmittedAnswer(question.id(), answer)).toList();
        return comparisonService.score(new ElectionAnswerRequest(model.modelId(), "extreme", answers), language);
    }



    private List<SubmittedAnswer> neutralAnswers()
    {
        return electionDataService.getModel("pt").questions().stream()
                .map(question -> new SubmittedAnswer(question.id(), AnswerValue.NEUTRAL)).toList();
    }
}
