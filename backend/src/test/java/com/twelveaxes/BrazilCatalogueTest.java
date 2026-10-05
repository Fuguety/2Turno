package com.twelveaxes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.twelveaxes.model.BrazilCatalogue;
import com.twelveaxes.service.BrazilCatalogueService;
import com.twelveaxes.service.QuizDataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@AutoConfigureMockMvc
class BrazilCatalogueTest
{
    @Autowired
    private BrazilCatalogueService catalogueService;
    @Autowired
    private QuizDataService quizDataService;
    @Autowired
    private MockMvc mockMvc;

    @Test
    void catalogueKeepsBrazilianFiguresAndPrioritizesRunoffCandidates()
    {
        var catalogue = catalogueService.catalogue("pt", "");
        assertThat(catalogue).hasSize(86).allMatch(person -> person.countryCode().equals("BR"));
        assertThat(catalogue.subList(0, 2).stream().map(BrazilCatalogue.Item::id))
                .containsExactly("lula-da-silva", "flavio-bolsonaro");
        assertThat(catalogue.stream().map(BrazilCatalogue.Item::id)).contains(
                "jair-bolsonaro", "marina-silva", "renan-santos", "guilherme-boulos", "nikolas-ferreira",
                "tarcisio-de-freitas", "fernando-haddad", "clariana-barao", "samara-martins",
                "augusto-cury", "richard-rasmussen", "machado-de-assis", "santos-dumont")
                .doesNotContain("donald-trump", "javier-milei", "lenin", "dom-manuel-i");
        assertThat(catalogue.stream().filter(BrazilCatalogue.Item::primaryCandidate)).hasSize(2);
        assertThat(quizDataService.getPersonalityById("donald-trump")).isNotNull();
    }



    @Test
    void bothLanguagesHaveIdenticalCountryScopeAndAccentInsensitiveSearch()
    {
        assertThat(catalogueService.catalogue("en", "").stream().map(BrazilCatalogue.Item::id))
                .containsExactlyInAnyOrderElementsOf(catalogueService.catalogue("pt", "").stream().map(BrazilCatalogue.Item::id).toList());
        assertThat(catalogueService.catalogue("pt", "flavio").stream().map(BrazilCatalogue.Item::id))
                .containsExactly("flavio-bolsonaro");
        assertThat(catalogueService.catalogue("pt", "Trump")).isEmpty();
        assertThat(catalogueService.catalogue("en", "Lenin")).isEmpty();
    }



    @Test
    void primaryProfilesUseElectionAxesAndOtherProfilesKeepOriginalScores()
    {
        var lula = catalogueService.profile("lula-da-silva", "pt");
        var flavio = catalogueService.profile("flavio-bolsonaro", "en");
        assertThat(lula.modelId()).isEqualTo("brazil-presidential-2026-v2");
        assertThat(lula.scores()).containsEntry("coordenacao", 75.0).containsEntry("armas", 83.3);
        assertThat(flavio.scores()).containsEntry("coordenacao", 29.2).containsEntry("armas", 16.7);
        var marina = catalogueService.profile("marina-silva", "pt");
        assertThat(marina.modelId()).isEqualTo("12axes-general");
        assertThat(marina.scores()).isEqualTo(quizDataService.getPersonalityProfiles().get("marina-silva").vector());
        assertThat(marina.axes()).isEqualTo(quizDataService.getAxes("pt"));
    }



    @Test
    void rejectsDirectInternationalProfileLookupInBothLanguages() throws Exception
    {
        for (String language : new String[]{"pt", "en"})
        {
            for (String identifier : new String[]{"donald-trump", "javier-milei", "lenin", "does-not-exist"})
            {
                assertThatThrownBy(() -> catalogueService.profile(identifier, language))
                        .isInstanceOf(ResponseStatusException.class);
                mockMvc.perform(get("/api/elections/brazil-2026/profiles/" + identifier).param("lang", language))
                        .andExpect(status().isNotFound());
            }
        }
    }



    @Test
    void catalogueAndProfileEndpointsRespectElectionScope() throws Exception
    {
        mockMvc.perform(get("/api/elections/brazil-2026/catalog"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(86))
                .andExpect(jsonPath("$[0].id").value("lula-da-silva"))
                .andExpect(jsonPath("$[1].id").value("flavio-bolsonaro"));
        mockMvc.perform(get("/api/elections/brazil-2026/catalog").param("query", "Trump"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/elections/brazil-2026/profiles/lula-da-silva").param("lang", "en"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.person.countryCode").value("BR"))
                .andExpect(jsonPath("$.modelId").value("brazil-presidential-2026-v2"));
    }
}
