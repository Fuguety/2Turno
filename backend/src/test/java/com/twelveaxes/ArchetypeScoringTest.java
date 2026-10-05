package com.twelveaxes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.twelveaxes.model.AnswerValue;
import com.twelveaxes.model.AxisResult;
import com.twelveaxes.model.ResultRequest;
import com.twelveaxes.model.SubmittedAnswer;
import com.twelveaxes.service.QuizDataService;
import com.twelveaxes.service.ScoringService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
class ArchetypeScoringTest {
    @Autowired
    private QuizDataService dataService;

    @Autowired
    private ScoringService scoringService;

    // 3 perguntas por eixo, todas neutras: cada eixo começa em 50%.
    private List<SubmittedAnswer> neutralShortQuiz() {
        return dataService.getQuestions().stream()
                .collect(java.util.stream.Collectors.groupingBy(q -> q.axisId()))
                .values().stream()
                .flatMap(questions -> questions.stream().limit(3))
                .map(q -> new SubmittedAnswer(q.id(), AnswerValue.NEUTRAL))
                .toList();
    }

    private double axis(List<AxisResult> results, String axisId) {
        return results.stream().filter(r -> r.axisId().equals(axisId)).findFirst().orElseThrow().leftPercent();
    }

    @Test
    void archetypeQuestionsAreServedWithTheQuiz() {
        var payload = dataService.getQuiz("short", "en");
        assertThat(payload.archetypeQuestions()).hasSize(5);
        assertThat(payload.archetypeQuestions().get(2).options()).hasSize(6);
        assertThat(payload.archetypeQuestions().getFirst().text()).isEqualTo("What should society rest on?");
    }

    @Test
    void eachChoiceCountsAsOneExtraAnswerOnEveryAxisItTouches() {
        var answers = neutralShortQuiz();
        var without = scoringService.score(new ResultRequest(answers, "short"));
        var with = scoringService.score(new ResultRequest(answers, "short", Map.of("economia", "F")));

        // Economia F = Privado 88 (leftPercent 12): (3 × 50 + 12) / 4 = 40.5
        assertThat(axis(with, "economia")).isEqualTo(40.5);
        assertThat(axis(with, "controle")).isEqualTo(39.5);
        assertThat(axis(with, "comercio")).isEqualTo(40.5);
        // Eixos que a alternativa não toca ficam iguais.
        assertThat(axis(with, "moral")).isEqualTo(axis(without, "moral"));
    }

    @Test
    void skippingKeepsTheResultUnchanged() {
        var answers = neutralShortQuiz();
        var skipped = scoringService.score(new ResultRequest(answers, "short", Map.of()));
        var legacy = scoringService.score(new ResultRequest(answers, "short"));
        assertThat(skipped).isEqualTo(legacy);
    }

    @Test
    void unknownChoiceIsRejected() {
        var request = new ResultRequest(neutralShortQuiz(), "short", Map.of("economia", "Z"));
        assertThatThrownBy(() -> scoringService.score(request)).isInstanceOf(ResponseStatusException.class);
    }
}
