import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { LANG } from '../../i18n';
import translations from '../../i18n/electionEducation.json';
import profiles from '../../data/electionProfiles.generated.json';
import presentation from '../../utils/electionPresentation.cjs';
import { compareElectionVector } from '../../services/electionApi';
import type { ElectionComparison } from '../../types/election';
import type { Axis } from '../../types/quiz';
import { CandidateCard, ProfileCard } from './ProfileComponents';

const text = translations[LANG];
const exampleScores = { coordenacao: 38, protecao_social: 42, tributacao: 35, provisao_publica: 32,
    trabalho: 38, direitos_sociais: 42, laicidade: 65, armas: 45, justica_penal: 58,
    ambiente: 52, diplomacia_eleitoral: 60, contrapesos: 55 };
const exampleAxisIdentifiers = ['coordenacao', 'direitos_sociais', 'laicidade', 'ambiente'];



export function PoliticalFamilyCard({ identifier }: { identifier: keyof typeof text.families })
{
    const family = presentation.familyLabels[identifier];
    return <article className="political-family-card" data-family={identifier}
        style={{ '--ideology-color': family[2], '--ideology-background': family[3] } as CSSProperties}>
        <span className="family-indicator" aria-hidden="true" />
        <h3>{family[LANG === 'en' ? 1 : 0]}</h3><p>{text.families[identifier]}</p>
    </article>;
}



export function PoliticalSpectrum()
{
    return <section className="education-section" id="espectro" aria-labelledby="spectrum-title">
        <p className="education-label">{text.spectrumLabel}</p><h2 id="spectrum-title">{text.spectrumTitle}</h2>
        <p>{text.spectrumDescription}</p>
        <div className="education-grid spectrum-grid">{Object.keys(text.families).map(identifier =>
            <PoliticalFamilyCard key={identifier} identifier={identifier as keyof typeof text.families} />)}</div>
        <p className="profile-note">{text.classificationNote}</p>
    </section>;
}



export function AxisExplanationCard({ axis, index }: { axis: Axis; index: number })
{
    return <article className="axis-explanation-card" data-axis={axis.id}>
        <span className="education-number">{String(index + 1).padStart(2, '0')}</span>
        <h3>{axis.label}</h3><p className="education-poles"><span>{axis.leftPole}</span><span aria-hidden="true">↔</span><span>{axis.rightPole}</span></p>
        <p>{text.axisDescriptions[axis.id as keyof typeof text.axisDescriptions]}</p>
    </article>;
}



export function HowItWorks()
{
    return <section className="education-section education-dark" id="como-funciona" aria-labelledby="how-title">
        <p className="education-label">{text.howLabel}</p><h2 id="how-title">{text.howTitle}</h2>
        <ol className="education-grid how-grid">{text.steps.map((step, index) => <li key={step.title}>
            <span className="education-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.description}</p>
        </li>)}</ol>
    </section>;
}



export function ResultExample()
{
    const [comparison, setComparison] = useState<ElectionComparison | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() =>
    {
        let active = true;
        setFailed(false);
        compareElectionVector(exampleScores).then(result =>
        {
            if (active) setComparison(result);
        }).catch(() =>
        {
            if (active) setFailed(true);
        });
        return () => { active = false; };
    }, [attempt]);
    const axes = profiles.axes[LANG].filter(axis => exampleAxisIdentifiers.includes(axis.id));
    return <section className="education-section" id="exemplo" aria-labelledby="example-title">
        <p className="education-label">{text.exampleLabel}</p><h2 id="example-title">{text.exampleTitle}</h2>
        <p>{text.exampleDescription}</p>
        <div className="example-layout">
            <ProfileCard axes={axes} scores={exampleScores} identifier="example-profile" illustrative />
            <div className="example-candidates">
                {comparison ? <><h3>{text.closest}: {comparison.candidates.filter(candidate => comparison.closestCandidateIds.includes(candidate.id)).map(candidate => candidate.name).join(' / ')}</h3>
                    {comparison.candidates.map(match =>
                    {
                        const candidate = profiles.candidates.find(profile => profile.id === match.id);
                        return candidate ? <CandidateCard key={match.id} candidate={candidate} compatibility={match.compatibility} /> : null;
                    })}</> : <div role="status"><p>{failed ? text.unavailable : text.loading}</p>
                    {failed && <button type="button" onClick={() => setAttempt(previous => previous + 1)}>{text.retry}</button>}</div>}
            </div>
        </div>
        <aside className="compatibility-explanation"><h3>{text.compatibilityTitle}</h3><p>{text.compatibilityDescription}</p></aside>
    </section>;
}



export function HomeEducation()
{
    return <div className="home-education">
        <section className="education-section education-introduction" aria-labelledby="introduction-title">
            <p className="education-label">{text.introductionLabel}</p><h2 id="introduction-title">{text.introductionTitle}</h2><p>{text.introduction}</p>
        </section>
        <PoliticalSpectrum />
        <section className="education-section" id="eixos" aria-labelledby="axes-title">
            <p className="education-label">{text.axesLabel}</p><h2 id="axes-title">{text.axesTitle}</h2><p>{text.axesDescription}</p>
            <div className="education-grid axes-grid">{profiles.axes[LANG].map((axis, index) => <AxisExplanationCard key={axis.id} axis={axis} index={index} />)}</div>
        </section>
        <HowItWorks /><ResultExample />
        <section className="education-section education-methodology" aria-labelledby="methodology-title">
            <p className="education-label">{text.methodologyLabel}</p><h2 id="methodology-title">{text.methodologyTitle}</h2><p>{text.methodologyDescription}</p>
            <a className="profile-link" href={`${LANG === 'en' ? '/en' : ''}/election-methodology`}>{text.methodologyLink}</a>
        </section>
    </div>;
}
