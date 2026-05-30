export const houseNames = [
  'Sanglier Doré', 'Ordre de la Chopine', 'Dragon Ivre', 'Table Bancale', 'Slip de Fer', 'Ménestrels Louches'
];

export const avatars = ['🛡️','🍺','🐉','🎻','🧙','🤡','⚔️','👑','🏹','🪓','🔥','🪙'];

export const stages = [
  { name:'La Taverne', icon:'🍻', vibe:'échauffement collectif' },
  { name:'Le Pont du Malaise', icon:'🌉', vibe:'votes et hontes douces' },
  { name:'L’Arène', icon:'⚔️', vibe:'duels' },
  { name:'La Forêt des Gages', icon:'🌲', vibe:'défis photo / vidéo' },
  { name:'Le Donjon Nuptial', icon:'🏰', vibe:'épreuves du marié' },
  { name:'Le Banquet Final', icon:'👑', vibe:'sacre de la maison gagnante' }
];

export const miniGames = [
  { kind:'Duel', title:'Joute verbale', seconds:45, points:3, needs:'2 joueurs', text:'Deux champions s’affrontent. Chacun doit complimenter le futur marié avec le vocabulaire le plus ridicule possible. La cour vote.' },
  { kind:'Vote', title:'Qui survivrait le moins au Moyen Âge ?', seconds:30, points:2, needs:'tout le monde', text:'Chaque maison propose un nom. La cour vote pour le plus condamné par les loups, les impôts ou sa propre bêtise.' },
  { kind:'Équipe', title:'Blason vivant', seconds:60, points:3, needs:'toutes les maisons', text:'Chaque maison fabrique un blason humain avec corps, objets et dignité sacrifiée. Le futur marié choisit le plus légendaire.' },
  { kind:'Photo', title:'Portrait de chevalier déchu', seconds:75, points:3, needs:'1 maison', text:'Prendre une photo dramatique du futur marié comme s’il venait de perdre son royaume. Bonus si accessoire improvisé.' },
  { kind:'Vidéo', title:'Oyez, oyez', seconds:45, points:3, needs:'1 maison', text:'Filmer 15 secondes d’annonce royale du mariage. Il faut commencer par “Oyez, oyez, braves gens”.' },
  { kind:'Duel', title:'Le regard du dragon', seconds:60, points:2, needs:'2 joueurs', text:'Duel de regard. Les autres peuvent déconcentrer avec bruitages de dragon, mais sans toucher les champions.' },
  { kind:'Vote', title:'Pire conseiller royal', seconds:30, points:2, needs:'tout le monde', text:'La cour désigne qui donnerait les pires conseils de mariage. L’élu improvise un conseil catastrophique.' },
  { kind:'Équipe', title:'Catapulte à compliments', seconds:60, points:4, needs:'toutes les maisons', text:'Chaque maison lance un maximum de compliments médiévaux au futur marié. Un mot médiéval obligatoire à chaque compliment.' },
  { kind:'Roi', title:'Procès du futur marié', seconds:90, points:4, needs:'marié + 2 camps', text:'Une maison accuse, une maison défend. Crime absurde obligatoire. Le jury vote coupable ou innocent.' },
  { kind:'Chaos', title:'La roue de la trahison', seconds:30, points:2, needs:'hasard', text:'La maison désignée peut défier une autre maison. Le gagnant vole 1 point. Le perdant reçoit une malédiction.' },
  { kind:'Photo', title:'La Sainte Relique', seconds:60, points:3, needs:'1 maison', text:'Trouver un objet banal et le présenter comme une relique sacrée. Photo souvenir obligatoire si possible.' },
  { kind:'Équipe', title:'Taverne improvisée', seconds:60, points:3, needs:'1 maison', text:'Improviser une scène de taverne avec un chevalier jaloux, un tavernier louche et une demande en mariage ratée.' },
  { kind:'Duel', title:'Sort magique inutile', seconds:45, points:2, needs:'2 joueurs', text:'Chaque champion invente un sort totalement inutile pour la vie de couple. La cour vote pour le plus absurde.' },
  { kind:'Finale', title:'Siège du Donjon Nuptial', seconds:120, points:5, needs:'toutes les maisons', text:'Chaque maison invente un cri de guerre, un serment pour le marié et désigne un champion final. Le marié sacre les vainqueurs.' }
];

export const events = [
  { title:'Dragon fiscal', effect:'La maison en tête paie l’impôt royal: -1 point ou mini-défi immédiat.' },
  { title:'Bénédiction de la Reine', effect:'La dernière maison double ses points sur la prochaine manche.' },
  { title:'Banquet royal', effect:'Tout le monde porte un toast médiéval. Le pire toast gagne 1 point.' },
  { title:'Trahison nocturne', effect:'Une maison peut défier une autre maison. Le gagnant vole 1 point.' },
  { title:'Malédiction du “par le Graal”', effect:'Un joueur doit finir chaque phrase par “par le Graal” jusqu’à la prochaine manche.' },
  { title:'Le Roi s’ennuie', effect:'Chaque maison a 15 secondes pour faire rire le futur marié.' }
];

export const secretRoles = [
  { name:'Le Traître', power:'Faire perdre son équipe discrètement. Si démasqué, les autres gagnent +2.' },
  { name:'Le Bouffon', power:'Faire rire 3 personnes pendant une manche pour gagner +2.' },
  { name:'Le Barde', power:'Transformer un événement en chanson et imposer les rimes à une maison.' },
  { name:'Le Garde du Corps', power:'Prendre un gage à la place du marié et gagner +2.' },
  { name:'Le Prophète', power:'Prédire le gagnant d’une épreuve. Si juste: +2.' }
];

export const mediaInspirations = [
  { label:'Festival médiéval — galerie', url:'https://commons.wikimedia.org/wiki/Medieval_festival' },
  { label:'Joute médiévale — inspiration', url:'https://commons.wikimedia.org/wiki/File:Tewkesbury_Medieval_Festival_2008_-_Jousting.jpg' },
  { label:'Jongleur manuscrit — domaine public', url:'https://commons.wikimedia.org/wiki/File:Tiberius_Psalter_-_Juggler.jpg' },
  { label:'Dés médiévaux — inspiration', url:'https://commons.wikimedia.org/wiki/File:Medieval_,_Dice_(FindID_246244).jpg' },
  { label:'Vidéos château Pixabay', url:'https://pixabay.com/videos/search/castle/' },
  { label:'Vidéos feu / torches Pexels', url:'https://www.pexels.com/search/videos/fire/' }
];

export function createTeams(players, teamCount = 3) {
  const clean = players.map(p => p.trim()).filter(Boolean);
  const count = Math.max(2, Math.min(Number(teamCount) || 3, 4, Math.max(2, clean.length)));
  const teams = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: houseNames[i],
    crest: avatars[i],
    score: 0,
    players: []
  }));
  clean.forEach((player, i) => teams[i % count].players.push({ name: player, avatar: avatars[(i + 3) % avatars.length], role: secretRoles[i % secretRoles.length].name }));
  return teams;
}

export function getStage(round = 0) {
  return stages[Math.min(stages.length - 1, round % stages.length)];
}

export function getMiniGame(round = 0) {
  return miniGames[round % miniGames.length];
}

export function getEvent(round = 0) {
  return events[round % events.length];
}

export function pickContestants(teams, round = 0) {
  const all = teams.flatMap(team => team.players.map(player => ({ ...player, teamId: team.id, house: team.name })));
  if (!all.length) return [];
  const first = all[round % all.length];
  const second = all[(round + Math.ceil(all.length / 2)) % all.length];
  return first.name === second.name ? [first] : [first, second];
}

export function rankTeams(teams) {
  return [...teams].sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
}
