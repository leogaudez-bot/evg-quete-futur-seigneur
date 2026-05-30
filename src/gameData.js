export const roles = [
  { name: 'Le Futur Seigneur', badge: '👑', brief: 'Le héros du soir. Il gagne sa légende à coups de courage, mauvaise foi et panache.' },
  { name: 'Le Grand Chambellan', badge: '📜', brief: 'Lit les règles, distribue les points, tranche les litiges sans appel.' },
  { name: 'Le Tavernier Royal', badge: '🍻', brief: 'Garant du banquet, des pauses, des toasts et des pactes douteux.' },
  { name: 'Le Moine Suspect', badge: '🕯️', brief: 'Bénit les épreuves mais ajoute toujours une condition absurde.' },
  { name: 'Le Ménestrel Officiel', badge: '🎻', brief: 'Transforme les moments gênants en chansons de geste.' },
  { name: 'Le Chevalier de la Mauvaise Foi', badge: '🛡️', brief: 'Conteste tout, surtout quand il a tort.' },
  { name: 'Le Bourreau de l’Ambiance', badge: '⚔️', brief: 'Désigne les duels, les défis et les sanctions.' }
];

export const quests = [
  { type:'Éloquence', title:'Serment de chevalerie', points:2, intensity:'soft', text:'Le futur seigneur déclame un serment solennel à sa future vie de marié. Trois mots imposés par la cour.' },
  { type:'Tribunal', title:'Procès de la mauvaise excuse', points:3, intensity:'medium', text:'Deux chevaliers accusent le futur marié d’un crime ridicule. Il a 90 secondes pour se défendre.' },
  { type:'Taverne', title:'Toast du vieux royaume', points:2, intensity:'soft', text:'Un participant invente un toast médiéval. Le futur seigneur doit le reprendre avec conviction.' },
  { type:'Duel', title:'Joute verbale', points:3, intensity:'medium', text:'Duel de compliments insultants: être drôle sans être méchant. Le public vote.' },
  { type:'Mémoire', title:'Chroniques embarrassantes', points:3, intensity:'medium', text:'La cour pose trois questions sur la légende passée du futur marié. Une erreur = pénitence légère.' },
  { type:'Créatif', title:'Blason improvisé', points:2, intensity:'soft', text:'Dessiner ou mimer le blason officiel du futur seigneur avec ses qualités les plus discutables.' },
  { type:'Audace', title:'Quête du ménestrel', points:4, intensity:'hard', text:'Composer un refrain de taverne en 60 secondes et le faire chanter par au moins trois personnes.' },
  { type:'Stratégie', title:'Conseil de guerre', points:3, intensity:'soft', text:'Le groupe doit choisir une tactique absurde pour survivre à un dragon administratif.' },
  { type:'Chance', title:'Dé du destin', points:1, intensity:'soft', text:'Lancez un dé réel ou imaginaire: pair = bonus, impair = mini défi imposé par le Chambellan.' },
  { type:'Finale', title:'Le pacte du seigneur', points:5, intensity:'medium', text:'Le futur marié reçoit trois conseils contradictoires et doit construire le code d’honneur du mariage.' },
  { type:'Duel', title:'Le pont du troll', points:3, intensity:'medium', text:'Pour passer le pont, répondre à une énigme inventée par le participant le plus fourbe.' },
  { type:'Social', title:'Ambassade royale', points:4, intensity:'hard', text:'Obtenir une approbation symbolique d’un inconnu ou d’un serveur, sans gêner ni forcer.' },
  { type:'Complicité', title:'Conseil des témoins', points:2, intensity:'soft', text:'Chaque témoin donne une qualité sincère du futur marié. Le héros doit en choisir une comme devise officielle.' },
  { type:'Rituel', title:'Cri de guerre', points:2, intensity:'soft', text:'Inventer le cri de guerre du royaume et le faire répéter par la table, sans hurler si le lieu ne s’y prête pas.' },
  { type:'Sagesse', title:'Conseil du vieux sage', points:2, intensity:'soft', text:'Le plus ancien du groupe invente une règle de vie conjugale. Le futur seigneur doit la reformuler en devise.' },
  { type:'Adresse', title:'Anneau du royaume', points:2, intensity:'soft', text:'Lancer une pièce, bouchon ou petit objet dans une chope vide à courte distance. Adapter au lieu.' },
  { type:'Histoire', title:'La légende officielle', points:2, intensity:'soft', text:'Raconter en 45 secondes une version héroïque et complètement exagérée de la rencontre du couple.' },
  { type:'Alliance', title:'Pacte des compagnons', points:2, intensity:'soft', text:'Deux participants inventent une promesse d’aide au futur marié pour survivre aux préparatifs.' },
  { type:'Mime', title:'Dragon invisible', points:2, intensity:'soft', text:'Mimer un combat héroïque contre un dragon invisible. La cour accorde les points si elle reconnaît le dragon.' }
];

export const events = [
  { title:'Bénédiction du moine', effect:'+1 point si le défi est joué avec un accent médiéval.' },
  { title:'Trahison au banquet', effect:'Un participant peut voler le rôle d’un autre pendant une manche.' },
  { title:'Dragon fiscal', effect:'Le futur seigneur perd 1 point sauf s’il invente une taxe absurde.' },
  { title:'Inspiration divine', effect:'Relancer immédiatement une quête si elle ne convient pas au contexte.' },
  { title:'Charrette royale', effect:'Tous les participants doivent encourager le héros pendant 10 secondes.' },
  { title:'Oracle douteux', effect:'Le groupe prédit une qualité de futur mari. Si le héros l’assume, +2.' },
  { title:'Peste de la flemme', effect:'Le défi suivant doit durer moins de 45 secondes.' },
  { title:'Banquet clandestin', effect:'Pause libre. Le Chambellan reprend ensuite avec une phrase dramatique.' }
];

export const endings = [
  { min: 0, title: 'Écuyer magnifique mais approximatif', text: 'Le royaume reste sceptique, mais l’ambiance a gagné.' },
  { min: 8, title: 'Chevalier de taverne certifié', text: 'Pas toujours noble, mais clairement légendaire.' },
  { min: 16, title: 'Seigneur du banquet', text: 'La cour reconnaît son panache et sa capacité à survivre à ses amis.' },
  { min: 24, title: 'Roi consort de la Sigma Chevalerie', text: 'Adoubement total. Le mariage peut trembler: le héros est prêt.' }
];

export function makeDeck({ duration='standard', intensity='medium' } = {}) {
  const order = { soft: 1, medium: 2, hard: 3 };
  const max = order[intensity] || 2;
  const count = duration === 'court' ? 6 : duration === 'long' ? 12 : 9;
  const filtered = quests.filter(q => order[q.intensity] <= max);
  return [...filtered].sort((a,b)=> a.title.localeCompare(b.title)).slice(0,count);
}

export function assignRoles(players, groomName) {
  const cleanPlayers = players.map(p => p.trim()).filter(Boolean);
  const all = [groomName || 'Le futur marié', ...cleanPlayers];
  return all.map((player, i) => ({ player, ...roles[i % roles.length] }));
}

export function finalEnding(score) {
  return endings.reduce((best, item) => score >= item.min ? item : best, endings[0]);
}
