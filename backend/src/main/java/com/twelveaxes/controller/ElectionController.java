package com.twelveaxes.controller;

import com.twelveaxes.model.ElectionAnswerRequest;
import com.twelveaxes.model.BrazilCatalogue;
import com.twelveaxes.model.ElectionComparison;
import com.twelveaxes.model.ElectionModel;
import com.twelveaxes.model.ElectionVectorRequest;
import com.twelveaxes.service.ElectionComparisonService;
import com.twelveaxes.service.ElectionDataService;
import com.twelveaxes.service.BrazilCatalogueService;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/elections/brazil-2026")
public class ElectionController
{
    private final ElectionDataService electionDataService;
    private final ElectionComparisonService comparisonService;
    private final BrazilCatalogueService catalogueService;

    public ElectionController(ElectionDataService electionDataService, ElectionComparisonService comparisonService,
            BrazilCatalogueService catalogueService)
    {
        this.electionDataService = electionDataService;
        this.comparisonService = comparisonService;
        this.catalogueService = catalogueService;
    }



    @GetMapping("/model")
    public ElectionModel model(@RequestParam(name = "lang", defaultValue = "pt") String language)
    {
        return electionDataService.getModel(language);
    }



    @GetMapping("/catalog")
    public List<BrazilCatalogue.Item> catalogue(
            @RequestParam(name = "lang", defaultValue = "pt") String language,
            @RequestParam(name = "query", defaultValue = "") String searchTerm)
    {
        return catalogueService.catalogue(language, searchTerm);
    }



    @GetMapping("/profiles/{identifier}")
    public BrazilCatalogue.Profile profile(@PathVariable String identifier,
            @RequestParam(name = "lang", defaultValue = "pt") String language)
    {
        return catalogueService.profile(identifier, language);
    }



    @GetMapping("/quiz")
    public ElectionModel.Quiz quiz(
            @RequestParam(defaultValue = "extended") String variant,
            @RequestParam(name = "lang", defaultValue = "pt") String language)
    {
        return electionDataService.getQuiz(variant, language);
    }



    @PostMapping("/results")
    public ElectionComparison results(
            @Valid @RequestBody ElectionAnswerRequest request,
            @RequestParam(name = "lang", defaultValue = "pt") String language)
    {
        return comparisonService.score(request, language);
    }



    @PostMapping("/compare")
    public ElectionComparison compare(
            @Valid @RequestBody ElectionVectorRequest request,
            @RequestParam(name = "lang", defaultValue = "pt") String language)
    {
        return comparisonService.compare(request, language);
    }
}
