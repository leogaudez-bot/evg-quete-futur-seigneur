import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Crown, Dice5, RotateCcw, Shield, Sparkles, Swords, Trophy } from 'lucide-react';
import { assignRoles, events, finalEnding, makeDeck } from './gameData.js';
import './styles.css';

const STORAGE = 'quete-futur-seigneur:v1';
const defaultConfig = { groomName: 'Le futur seigneur', playersText: 'Chambellan\nTavernier\nMoine suspect\nMénestrel', duration: 'standard', intensity: 'medium' };

function safeLoad(){ try { return JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch { return null; } }
function save(state){ try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch {} }
function cleanPlayers(text){ return text.split('\n').map(x=>x.trim()).filter(Boolean); }

function App(){
  const loaded = safeLoad();
  const [screen,setScreen]=useState(loaded?.screen || 'home');
  const [config,setConfig]=useState(loaded?.config || defaultConfig);
  const [score,setScore]=useState(loaded?.score || 0);
  const [index,setIndex]=useState(loaded?.index || 0);
  const [eventIndex,setEventIndex]=useState(loaded?.eventIndex || 0);
  const [scoredIndex,setScoredIndex]=useState(loaded?.scoredIndex ?? -1);
  const [toast,setToast]=useState('');
  const [reduced,setReduced]=useState(false);

  const deck = useMemo(()=> makeDeck(config), [config]);
  const roles = useMemo(()=> assignRoles(cleanPlayers(config.playersText), config.groomName), [config]);
  const current = deck[Math.min(index, deck.length-1)];
  const event = events[eventIndex % events.length];
  const finished = index >= deck.length;
  const ending = finalEnding(score);

  useEffect(()=> save({screen,config,score,index,eventIndex,scoredIndex}), [screen,config,score,index,eventIndex,scoredIndex]);
  useEffect(()=> { const q = matchMedia('(prefers-reduced-motion: reduce)'); setReduced(q.matches); }, []);

  const update = (patch)=> setConfig(c=>({...c,...patch}));
  const begin = ()=> { setScore(0); setIndex(0); setEventIndex(0); setScoredIndex(-1); setScreen('play'); setToast('La quête commence. Que les tavernes tremblent.'); };
  const point = (delta)=> {
    if (scoredIndex === index) { setToast('Cette quête est déjà notée. Passe à la suivante.'); return; }
    setScore(s=>Math.max(0,s+delta)); setScoredIndex(index); setToast(delta>0?`+${delta} points de gloire`:`${delta} point de disgrâce`);
  };
  const next = ()=> { setIndex(i=>i+1); setToast('Nouvelle quête tirée du grimoire.'); };
  const drawEvent = ()=> { setEventIndex(i=>i+1); setToast('Le destin vient de changer les règles.'); };
  const reset = ()=> { localStorage.removeItem(STORAGE); setConfig(defaultConfig); setScore(0); setIndex(0); setEventIndex(0); setScoredIndex(-1); setScreen('home'); setToast('Parchemin brûlé. Nouvelle légende prête.'); };

  return <main className={reduced?'reduced':''}>
    <div className="bg-orb orb-a"/><div className="bg-orb orb-b"/>
    {toast && <div className="toast" onAnimationEnd={()=>setToast('')}>{toast}</div>}
    <header className="topbar"><div className="brand"><Shield/> <span>EVG Médiéval</span></div><button className="ghost" onClick={reset}><RotateCcw size={16}/> Reset</button></header>

    {screen==='home' && <section className="hero card">
      <div className="copy">
        <p className="eyebrow">Jeu de soirée configurable</p>
        <h1>La Quête du Futur Seigneur</h1>
        <p className="lead">Un jeu de société mobile pour adouber le futur marié: rôles, quêtes, cartes événement, score et finale épique.</p>
        <div className="actions"><button className="primary" onClick={()=>setScreen('config')}><Crown/> Configurer la quête</button><button className="secondary" onClick={()=>setScreen('play')}><Dice5/> Démo directe</button></div>
      </div>
      <img className="hero-img" src={`${import.meta.env.BASE_URL}hero-medieval.png`} alt="Illustration médiévale festive du futur marié en chevalier"/>
    </section>}

    {screen==='config' && <section className="card config">
      <p className="eyebrow">Parchemin de préparation</p><h2>Configure la partie</h2>
      <label>Nom du futur marié<input value={config.groomName} onChange={e=>update({groomName:e.target.value})} placeholder="Ex: Piotr le Magnifique"/></label>
      <label>Participants, un par ligne<textarea value={config.playersText} onChange={e=>update({playersText:e.target.value})} rows="6"/></label>
      <div className="grid2"><label>Durée<select value={config.duration} onChange={e=>update({duration:e.target.value})}><option value="court">Court · 6 défis</option><option value="standard">Standard · 9 défis</option><option value="long">Long · 12 défis</option></select></label><label>Intensité<select value={config.intensity} onChange={e=>update({intensity:e.target.value})}><option value="soft">Soft</option><option value="medium">Moyen</option><option value="hard">Hard contrôlé</option></select></label></div>
      <div className="preview"><h3>Distribution</h3>{roles.map((r,i)=><div className="role" key={i}><b>{r.badge} {r.player}</b><span>{r.name} — {r.brief}</span></div>)}</div>
      <button className="primary wide" onClick={begin}><Swords/> Lancer la quête</button>
    </section>}

    {screen==='play' && !finished && <section className="play-layout">
      <aside className="score card"><Trophy/><strong>{score}</strong><span>points de gloire</span><progress max={deck.length} value={index}/><small>Quête {index+1}/{deck.length}</small></aside>
      <section className="quest card flip-in">
        <p className="eyebrow">{current.type} · {current.intensity}</p><h2>{current.title}</h2><p>{current.text}</p><div className="points">Récompense: +{current.points}</div>{scoredIndex === index && <div className="locked">Score verrouillé pour cette quête</div>}
        <div className="actions"><button className="primary" disabled={scoredIndex === index} onClick={()=>point(current.points)}><Sparkles/> Réussi</button><button className="secondary" disabled={scoredIndex === index} onClick={()=>point(-1)}>Raté noble</button><button className="ghost" onClick={next}>Suivant</button></div>
      </section>
      <section className="event card"><p className="eyebrow">Carte événement · effet à appliquer manuellement</p><h3>{event.title}</h3><p>{event.effect}</p><button className="secondary wide" onClick={drawEvent}><Dice5/> Tirer un autre destin</button></section>
    </section>}

    {screen==='play' && finished && <section className="final card"><Crown className="big"/><p className="eyebrow">Adoubement final</p><h1>{ending.title}</h1><p>{ending.text}</p><p className="scoreline">Score final: <b>{score}</b> points</p><div className="oath">“Moi, {config.groomName || 'futur seigneur'}, promets d’honorer le royaume, le banquet et les témoins qui m’ont porté jusque-là.”</div><button className="primary" onClick={reset}>Rejouer une légende</button></section>}
  </main>
}

createRoot(document.getElementById('root')).render(<App/>);
