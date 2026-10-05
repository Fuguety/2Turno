import { useId, useState } from 'react';
import { LANG } from '../../i18n';
import type { Axis } from '../../types/quiz';
import presentation from '../../utils/electionPresentation.cjs';
import { InfoSheet } from '../results/InfoSheet';

export interface CandidateProfile
{
    id: string;
    name: string;
    party: string;
    number: number;
    portrait?: string | null;
    description: { pt: string; en: string };
    scores: Record<string, number>;
    runningMate?: unknown;
}

export const profileText = LANG === 'pt' ?
{
    yourProfile: 'Seu perfil', axes: 'Seu perfil nos 12 eixos', candidateAxes: 'Perfil nos 12 eixos',
    quickInfo: 'Informações rápidas', fullProfile: 'Ver perfil completo', compatibility: 'Compatibilidade',
    portraitMissing: 'Retrato indisponível', note: 'Cada percentual representa sua posição entre os dois polos, não intenção de voto.',
    compare: 'Você, Lula e Flávio nos mesmos eixos', exact: 'Os valores exatos estão disponíveis em cada eixo.',
    you: 'Você', questionnaire: 'Faça o teste', start: 'Começar',
    questionnaireDescription: 'Responda às perguntas e descubra onde você se posiciona nos 12 eixos políticos.',
    formats: 'Escolha a duração do questionário', begin: 'Começar questionário', traits: 'Características do perfil'
} :
{
    yourProfile: 'Your profile', axes: 'Your profile across the 12 axes', candidateAxes: 'Profile across the 12 axes',
    quickInfo: 'Quick information', fullProfile: 'View full profile', compatibility: 'Compatibility',
    portraitMissing: 'Portrait unavailable', note: 'Each percentage represents your position between the two poles, not voting intention.',
    compare: 'You, Lula and Flávio on the same axes', exact: 'Exact values remain available on every axis.',
    you: 'You', questionnaire: 'Take the test', start: 'Start',
    questionnaireDescription: 'Answer the questions and discover where you stand on the 12 political axes.',
    formats: 'Choose the questionnaire length', begin: 'Start questionnaire', traits: 'Profile characteristics'
};



export function candidatePage(identifier: string)
{
    return `${LANG === 'en' ? '/en' : ''}/candidatos/${identifier}`;
}



export function IdeologyHeader({ scores }: { scores?: Record<string, number> })
{
    return <div dangerouslySetInnerHTML={{ __html: presentation.ideologyHeaderMarkup(scores, LANG) }} />;
}



export function AxisBar({ axis, score }: { axis: Axis; score?: number })
{
    return <div dangerouslySetInnerHTML={{ __html: presentation.axisBarMarkup(axis, score, LANG) }} />;
}



export function AxisProfile({ axes, scores, explainUser = false }: { axes: Axis[]; scores?: Record<string, number>; explainUser?: boolean })
{
    return <div dangerouslySetInnerHTML={{ __html: presentation.axisProfileMarkup(axes, scores, LANG, explainUser) }} />;
}



export function ProfilePortrait({ name, source }: { name: string; source?: string | null })
{
    const [failedSource, setFailedSource] = useState<string | null>(null);
    return source && source !== failedSource ?
        <img className="profile-portrait" src={source} alt={name} width="96" height="96" onError={() => setFailedSource(source)} /> :
        <span className="profile-portrait portrait-fallback" role="img" aria-label={`${profileText.portraitMissing}: ${name}`}>{name.charAt(0)}</span>;
}



export function CandidateQuickInfo({ candidate }: { candidate: CandidateProfile })
{
    const [open, setOpen] = useState(false);
    const titleIdentifier = useId();
    return <>
        <button className="candidate-info-button" type="button" aria-label={`${profileText.quickInfo}: ${candidate.name}`}
            aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>?</button>
        {open && <InfoSheet titleId={titleIdentifier} onClose={() => setOpen(false)} className="candidate-quick-info">
            <div className="profile-identity"><ProfilePortrait name={candidate.name} source={candidate.portrait} />
                <div><h3 id={titleIdentifier}>{candidate.name}</h3><p>{candidate.party} · {candidate.number}</p></div></div>
            <IdeologyHeader scores={candidate.scores} />
            <p>{candidate.description[LANG]}</p>
            <a className="profile-link" href={candidatePage(candidate.id)} target="_blank" rel="noopener noreferrer">{profileText.fullProfile}</a>
        </InfoSheet>}
    </>;
}



export function CandidateCard({ candidate, compatibility }: { candidate: CandidateProfile; compatibility?: number })
{
    return <article className="candidate-card" data-candidate={candidate.id}>
        <div className="profile-identity">
            <ProfilePortrait name={candidate.name} source={candidate.portrait} />
            <div><h2>{candidate.name}</h2><p className="profile-ballot">{candidate.party} · {candidate.number}</p></div>
            <CandidateQuickInfo candidate={candidate} />
        </div>
        <IdeologyHeader scores={candidate.scores} />
        {compatibility !== undefined && <p className="candidate-compatibility">{profileText.compatibility} <strong>{compatibility.toFixed(1)}%</strong></p>}
        <p className="candidate-description">{candidate.description[LANG]}</p>
        <a className="profile-link" href={candidatePage(candidate.id)} target="_blank" rel="noopener noreferrer">{profileText.fullProfile}</a>
    </article>;
}



export function ProfileCard({ axes, scores }: { axes: Axis[]; scores: Record<string, number> })
{
    return <section className="user-profile" id="seu-perfil" aria-labelledby="your-profile-title">
        <h1 id="your-profile-title">{profileText.yourProfile}</h1>
        <IdeologyHeader scores={scores} />
        <p className="profile-note">{profileText.note}</p>
        <h2>{profileText.axes}</h2>
        <AxisProfile axes={axes} scores={scores} explainUser />
    </section>;
}



export function ComparisonAxis({ axis, markers }: { axis: Axis; markers: { name: string; symbol: string; score?: number }[] })
{
    return <div dangerouslySetInnerHTML={{ __html: presentation.comparisonAxisMarkup(axis, markers, LANG) }} />;
}
