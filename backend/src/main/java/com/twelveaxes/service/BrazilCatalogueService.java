package com.twelveaxes.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.twelveaxes.model.AxisResult;
import com.twelveaxes.model.BrazilCatalogue;
import com.twelveaxes.model.ElectionModel;
import com.twelveaxes.model.Personality;
import com.twelveaxes.model.SubmittedAnswer;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BrazilCatalogueService
{
    private final ObjectMapper objectMapper;
    private final QuizDataService quizDataService;
    private final ElectionDataService electionDataService;
    private final ScoringService scoringService;
    private BrazilCatalogue configuration;
    private Set<String> allowedIdentifiers;

    public BrazilCatalogueService(ObjectMapper objectMapper, QuizDataService quizDataService,
            ElectionDataService electionDataService, ScoringService scoringService)
    {
        this.objectMapper = objectMapper;
        this.quizDataService = quizDataService;
        this.electionDataService = electionDataService;
        this.scoringService = scoringService;
    }



    @PostConstruct
    public void load() throws IOException
    {
        try (var input = new ClassPathResource("data/elections/brazil-catalogue.json").getInputStream())
        {
            configuration = objectMapper.readValue(input, BrazilCatalogue.class);
        }
        allowedIdentifiers = Set.copyOf(configuration.profileIds());
        Set<String> electionCandidates = electionDataService.getModel("pt").candidates().stream()
                .map(ElectionModel.Candidate::id).collect(Collectors.toSet());
        if (!"BR".equals(configuration.countryCode()) || !"brazil-2026".equals(configuration.electionId())
                || allowedIdentifiers.size() != configuration.profileIds().size()
                || !new HashSet<>(configuration.primaryCandidateIds()).equals(electionCandidates)
                || !allowedIdentifiers.containsAll(electionCandidates)
                || allowedIdentifiers.stream().anyMatch(identifier -> quizDataService.getPersonalityById(identifier) == null))
        {
            throw new IllegalStateException("Invalid Brazilian election catalogue configuration.");
        }
    }



    public List<BrazilCatalogue.Item> catalogue(String language, String searchTerm)
    {
        String normalizedSearch = normalize(searchTerm == null ? "" : searchTerm);
        return quizDataService.getPersonalities(language).stream()
                .filter(person -> allowedIdentifiers.contains(person.id()))
                .map(this::item)
                .filter(person -> normalize(person.name() + " " + person.role()).contains(normalizedSearch))
                .sorted(Comparator.comparingInt((BrazilCatalogue.Item person) -> priority(person.id()))
                        .thenComparing(person -> normalize(person.name())))
                .toList();
    }



    public BrazilCatalogue.Profile profile(String identifier, String language)
    {
        if (!allowedIdentifiers.contains(identifier))
        {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil indisponível no catálogo brasileiro.");
        }
        Personality person = quizDataService.getPersonalityById(identifier, language);
        ElectionModel model = electionDataService.getModel(language);
        ElectionModel.Candidate candidate = model.candidates().stream()
                .filter(profile -> profile.id().equals(identifier)).findFirst().orElse(null);
        if (candidate != null)
        {
            List<SubmittedAnswer> answers = candidate.answers().entrySet().stream()
                    .map(answer -> new SubmittedAnswer(answer.getKey(), answer.getValue())).toList();
            var scores = scoringService.scoreAnswers(answers, model.questions(), model.axes(), language).stream()
                    .collect(Collectors.toMap(AxisResult::axisId, AxisResult::leftPercent));
            return new BrazilCatalogue.Profile(item(person), model.modelId(), model.axes(), scores);
        }
        return new BrazilCatalogue.Profile(item(person), "12axes-general",
                quizDataService.getAxes(language), quizDataService.getPersonalityProfiles().get(identifier).vector());
    }



    private BrazilCatalogue.Item item(Personality person)
    {
        return new BrazilCatalogue.Item(person.id(), person.name(), person.role(), person.category(),
                person.description(), person.imagePath(), configuration.countryCode(),
                configuration.primaryCandidateIds().contains(person.id()));
    }



    private int priority(String identifier)
    {
        int index = configuration.primaryCandidateIds().indexOf(identifier);
        return index < 0 ? configuration.primaryCandidateIds().size() : index;
    }



    private String normalize(String text)
    {
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT);
    }
}
