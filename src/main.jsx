import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Crown, Dice5, Film, Flame, RotateCcw, Shield, Sparkles, Swords, Timer, Trophy, Users } from 'lucide-react';
import { createTeams, getEvent, getMiniGame, getStage, mediaInspirations, pickContestants, rankTeams, stages } from './gameData.js';
import './styles.css';

const STORAGE = 'quete-futur-seigneur:v2';
const defaultConfig = { groomName:'Le Futur Marié', playersText:'Léo\nMax\nThomas\nAlex\nHugo\nNico\nPierre\nBen', teamCount:3, duration:8, shame:'Chevalier téméraire' };
const reactions = ['🍺','🐉','👑','🍅','🔥','💀','🪙','📯'];

function load(){ try { return JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch { return null; } }
function persist(s){ try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch {} }
function players(text){ return text.split('\n').map(x=>x.trim()).filter(Boolean); }
function asset(name){ return `${import.meta.env.BASE_URL}${name}`; }

function App(){
  const saved = load();
  const [screen,setScreen] = useState(saved?.screen || 'home');
  const [config,setConfig] = useState(saved?.config || defaultConfig);
  const [teams,setTeams] = useState(saved?.teams || createTeams(players(defaultConfig.playersText), defaultConfig.teamCount));
  const [round,setRound] = useState(saved?.round || 0);
  const [phase,setPhase] = useState(saved?.phase || 'wheel');
  const [spinning,setSpinning] = useState(false);
  const [dice,setDice] = useState(saved?.dice || 1);
  const [selectedContestants,setSelectedContestants] = useState(saved?.selectedContestants || []);
  const [time,setTime] = useState(0);
  const [running,setRunning] = useState(false);
  const [burst,setBurst] = useState([]);
  const [toast,setToast] = useState('');

  const stage = getStage(round);
  const game = getMiniGame(round);
  const event = getEvent(round);
  const contestants = useMemo(()=> pickContestants(teams, round), [teams, round]);
  const activeContestants = selectedContestants.length ? selectedContestants : contestants;
  const ranking = rankTeams(teams);
  const finished = round >= Number(config.duration);

  useEffect(()=> persist({screen,config,teams,round,phase,dice,selectedContestants}), [screen,config,teams,round,phase,dice,selectedContestants]);
  useEffect(()=> {
    if(!running || time <= 0) return;
    const id = setInterval(()=> setTime(t => Math.max(0, t - 1)), 1000);
    return ()=> clearInterval(id);
  }, [running, time]);
  useEffect(()=> { if(time === 0 && running){ setRunning(false); pop('⏰ Temps écoulé !'); } }, [time, running]);

  const update = patch => setConfig(c => ({...c, ...patch}));
  const pop = msg => setToast(msg);
  const react = emoji => {
    const id = Date.now() + Math.random();
    setBurst(b => [...b.slice(-16), { id, emoji, left: 8 + Math.random()*84 }]);
    setTimeout(()=> setBurst(b => b.filter(x => x.id !== id)), 1400);
  };
  const start = () => {
    const t = createTeams(players(config.playersText), config.teamCount);
    setTeams(t); setSelectedContestants([]); setRound(0); setPhase('wheel'); setScreen('game'); setTime(0); setRunning(false); pop('Les maisons entrent dans la taverne.');
  };
  const spinWheel = () => {
    setSpinning(true); react('📯'); react('🔥');
    const pool = teams.flatMap(team => team.players.map(player => ({ ...player, teamId: team.id, house: team.name })));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(game.kind === 'Duel' ? 2 : 1, shuffled.length));
    setTimeout(()=> { setSelectedContestants(picked); setSpinning(false); setPhase('card'); pop(`${picked.map(c=>c.name).join(' vs ') || 'La cour'} désigné par le destin !`); }, 2400);
  };
  const rollDice = () => {
    let value = 1 + ((round + Date.now()) % 6);
    setDice(value); react(['⚀','⚁','⚂','⚃','⚄','⚅'][value-1]); pop(`Dé royal: ${value}`);
  };
  const startTimer = () => { setTime(game.seconds); setRunning(true); setPhase('timer'); react('🔥'); };
  const award = (teamId, pts = game.points) => {
    setTeams(ts => ts.map(t => t.id === teamId ? { ...t, score: t.score + pts } : t));
    pop(`+${pts} gloire pour ${teams.find(t=>t.id===teamId)?.name}`); ['🪙','👑','🔥','🪙','🍺'].forEach((e,i)=>setTimeout(()=>react(e), i*80));
  };
  const nextRound = () => { setRound(r=>r+1); setSelectedContestants([]); setPhase('wheel'); setTime(0); setRunning(false); pop('Le pion avance sur la carte du royaume.'); };
  const reset = () => { localStorage.removeItem(STORAGE); setScreen('home'); setConfig(defaultConfig); setTeams(createTeams(players(defaultConfig.playersText), defaultConfig.teamCount)); setSelectedContestants([]); setRound(0); setPhase('wheel'); setToast('Nouvelle campagne prête.'); };

  return <main>
    <div className="ambience"><span/> <span/> <span/></div>
    {burst.map(b => <i key={b.id} className="reaction" style={{left:`${b.left}%`}}>{b.emoji}</i>)}
    {toast && <div className="toast" onAnimationEnd={()=>setToast('')}>{toast}</div>}
    <header className="topbar"><b><Shield/> Tournoi EVG</b><button onClick={reset} className="ghost"><RotateCcw size={16}/> Reset</button></header>

    {screen === 'home' && <section className="hero card">
      <div><p className="eyebrow">Jackbox médiéval autour d’un téléphone</p><h1>La Quête du Futur Seigneur</h1><p className="lead">Plus un jeu solo: forme des maisons, fais tourner la roue, lance des duels, votes, timers, défis photo/vidéo et sacre la maison victorieuse.</p><div className="actions"><button className="primary" onClick={()=>setScreen('config')}><Users/> Former les maisons</button><button className="secondary" onClick={start}><Sparkles/> Démo chaos</button></div></div>
      <img src={asset('tavern-party.png')} className="hero-img" alt="Taverne médiévale festive avec équipes autour d'un jeu"/>
    </section>}

    {screen === 'config' && <section className="config card">
      <p className="eyebrow">La Taverne</p><h2>Participants et maisons</h2>
      <label>Nom du futur marié<input value={config.groomName} onChange={e=>update({groomName:e.target.value})}/></label>
      <label>Joueurs, un par ligne<textarea rows="8" value={config.playersText} onChange={e=>update({playersText:e.target.value})}/></label>
      <div className="grid3"><label>Maisons<select value={config.teamCount} onChange={e=>update({teamCount:e.target.value})}><option>2</option><option>3</option><option>4</option></select></label><label>Manches<select value={config.duration} onChange={e=>update({duration:e.target.value})}><option value="6">6 rapides</option><option value="8">8 standard</option><option value="12">12 campagne</option></select></label><label>Niveau<select value={config.shame} onChange={e=>update({shame:e.target.value})}><option>Gentil troubadour</option><option>Chevalier téméraire</option><option>Bouffon du roi</option><option>Donjon contrôlé</option></select></label></div>
      <Preview config={config}/><button className="primary wide" onClick={start}><Crown/> Commencer le tournoi</button>
    </section>}

    {screen === 'game' && !finished && <section className="game">
      <Scoreboard teams={teams} ranking={ranking}/>
      <section className={`arena card phase-${phase}`}>
        <Map round={round} duration={config.duration}/>
        <p className="eyebrow">{stage.icon} {stage.name} · {stage.vibe}</p>
        {phase === 'wheel' && <Wheel teams={teams} contestants={activeContestants} spinning={spinning} onSpin={spinWheel}/>} 
        {phase === 'card' && <Card game={game} contestants={activeContestants} dice={dice} onDice={rollDice} onTimer={startTimer} onVote={()=>setPhase('vote')}/>} 
        {phase === 'timer' && <TimerScreen game={game} time={time} running={running} setRunning={setRunning} onDone={()=>setPhase('vote')}/>} 
        {phase === 'event' && <EventScreen event={event} onBack={()=>setPhase('card')} react={react}/>} 
        {phase === 'vote' && <Vote teams={teams} award={award} nextRound={nextRound}/>} 
      </section>
      <aside className="side">
        <section className="event card"><p className="eyebrow">Événement chaos</p><h3>{event.title}</h3><p>{event.effect}</p><button className="secondary wide" onClick={()=>setPhase('event')}>Appliquer à main levée</button></section>
        <section className="card media"><p className="eyebrow"><Film size={14}/> Ambiance / inspi</p>{mediaInspirations.slice(0,3).map(m=><a key={m.url} href={m.url} target="_blank">{m.label}</a>)}</section>
        <Reactions react={react}/>
      </aside>
    </section>}

    {screen === 'game' && finished && <Final ranking={ranking} groom={config.groomName} reset={reset}/>} 
  </main>
}

function Preview({config}){ const t = createTeams(players(config.playersText), config.teamCount); return <div className="teams-preview">{t.map(team=><div className="house" key={team.id}><strong>{team.crest} Maison {team.name}</strong><small>{team.players.map(p=>p.name).join(', ') || 'à recruter'}</small></div>)}</div> }
function Scoreboard({teams, ranking}){ return <aside className="score card"><h3><Trophy/> Score des maisons</h3>{ranking.map((t,i)=><div className="rank" key={t.id}><b>{i+1}. {t.crest} {t.name}</b><span>{t.score}</span></div>)}</aside> }
function Map({round,duration}){ return <div className="mapline">{stages.map((s,i)=><div key={s.name} className={i<=round%stages.length?'active':''}><span>{s.icon}</span></div>)}<small>Manche {round+1}/{duration}</small></div> }
function Wheel({teams, contestants, spinning, onSpin}){ const names = contestants.map(c=>c.name).join(' vs ') || 'la cour'; return <div className="wheel-wrap"><div className={`wheel ${spinning?'spinning':''}`}>{teams.map((t,i)=><span key={t.id} style={{'--i':i}}>{t.crest}</span>)}<b>⚜️</b></div><h2>Roue du destin</h2><p>Elle choisit les victimes, les champions ou les juges.</p><button className="primary" onClick={onSpin} disabled={spinning}><Dice5/> {spinning?'La roue grince...':`Tourner pour ${names}`}</button></div> }
function Card({game, contestants, dice, onDice, onTimer, onVote}){ return <div className={`challenge ${game.kind.toLowerCase()}`}><div className="card-art"><img src={asset(game.kind === 'Duel' ? 'arena-duel.png' : 'avatar-sheet.png')} alt="Illustration de mini jeu médiéval"/></div><p className="eyebrow">{game.kind} · {game.needs}</p><h2>{game.title}</h2><p>{game.text}</p><div className="contestants">{contestants.map(c=><span key={c.name}>{c.avatar} {c.name}<small>{c.house}</small></span>)}</div><div className="tools"><button className="secondary" onClick={onDice}>🎲 Dé royal: {dice}</button><button className="primary" onClick={onTimer}><Timer/> Lancer {game.seconds}s</button><button className="ghost" onClick={onVote}>Passer au vote</button></div></div> }
function TimerScreen({game,time,running,setRunning,onDone}){ return <div className={`timer ${time<=10?'danger':''}`}><h2>{time || game.seconds}</h2><p>{game.title}</p><div className="sand"><span style={{height:`${Math.max(0,Math.min(100,time/game.seconds*100))}%`}}/></div><button className="primary" onClick={()=>setRunning(!running)}>{running?'Pause':'Reprendre'}</button><button className="secondary" onClick={onDone}>Terminer / voter</button></div> }
function EventScreen({event,onBack,react}){ return <div className="event-screen"><h2>⚡ {event.title}</h2><p>{event.effect}</p><div className="event-burst">🐉 👑 🍺 🔥</div><button className="primary" onClick={()=>{['🐉','🔥','👑'].forEach(react); onBack();}}>C’est appliqué, retour au défi</button></div> }
function Vote({teams, award, nextRound}){ return <div className="vote"><h2>Jugement du Royaume</h2><p>Vote à main levée autour du téléphone, puis attribue la gloire.</p><div className="vote-grid">{teams.map(t=><button key={t.id} onClick={()=>award(t.id)}>{t.crest}<b>{t.name}</b><small>+ gloire</small></button>)}</div><button className="ghost wide" onClick={nextRound}>Manche suivante</button></div> }
function Reactions({react}){ return <section className="reactions card"><p className="eyebrow">Réactions live</p><div>{reactions.map(r=><button key={r} onClick={()=>react(r)}>{r}</button>)}</div></section> }
function Final({ranking,groom,reset}){ return <section className="final card"><Flame className="big"/><p className="eyebrow">Banquet final</p><h1>{ranking[0]?.crest} Maison {ranking[0]?.name}</h1><p>La maison victorieuse devient <b>Gardienne du Graal Nuptial</b>. {groom} lit le serment final choisi par les vainqueurs.</p><div className="podium">{ranking.map((t,i)=><div key={t.id}><span>{i+1}</span><b>{t.crest} {t.name}</b><small>{t.score} gloire</small></div>)}</div><button className="primary" onClick={reset}>Rejouer une campagne</button></section> }

createRoot(document.getElementById('root')).render(<App/>);
