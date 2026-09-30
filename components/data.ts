import type { Contest, QuizQuestion, Match, Player, Notification, User, Badge, LeaderboardEntry } from '../types';

export const players: { [key: string]: Player } = {
    camille: { 
        name: 'Camille Bernard', 
        avatar: 'https://picsum.photos/id/1027/100/100',
        bio: 'Stratège en mathématiques et passionnée de quiz littéraires.',
        stats: { rank: 1, totalWinnings: 1250000, matchesPlayed: 88, winRate: 78 },
        badges: ['quiz-grandmaster', 'contest-winner', 'high-score', 'perfect-score']
    },
    hugo: { 
        name: 'Hugo Petit', 
        avatar: 'https://picsum.photos/id/1005/100/100',
        bio: 'Spécialiste de l\'histoire et de la géographie. Toujours prêt pour un défi !',
        stats: { rank: 5, totalWinnings: 780000, matchesPlayed: 120, winRate: 65 },
        badges: ['quiz-master', 'first-match']
    },
    manon: { 
        name: 'Manon Dubois', 
        avatar: 'https://picsum.photos/id/1011/100/100',
        bio: 'La culture générale est mon domaine. J\'adore les tournois !',
        stats: { rank: 3, totalWinnings: 950000, matchesPlayed: 95, winRate: 71 },
        badges: ['tournament-champ', 'quiz-master', 'high-score']
    },
    moussa: { 
        name: 'Moussa Traoré', 
        avatar: 'https://picsum.photos/id/1012/100/100',
        stats: { rank: 12, totalWinnings: 450000, matchesPlayed: 150, winRate: 55 },
        badges: ['quiz-novice', 'first-match']
    },
    lea: { 
        name: 'Léa Dupont', 
        avatar: 'https://picsum.photos/id/1013/100/100',
        stats: { rank: 8, totalWinnings: 620000, matchesPlayed: 110, winRate: 68 },
        badges: ['quiz-master', 'perfect-score']
    },
    julien: { name: 'Julien Martin', avatar: 'https://picsum.photos/id/1014/100/100' },
    aissatou: { name: 'Aïssatou Diallo', avatar: 'https://picsum.photos/id/1015/100/100' },
    amine: { name: 'Amine El Fassi', avatar: 'https://picsum.photos/id/1025/100/100' },
    fatou: { name: 'Fatou Ndiaye', avatar: 'https://picsum.photos/id/1028/100/100' },
    yann: { name: 'Yannick Moreau', avatar: 'https://picsum.photos/id/1031/100/100' },
    chloe: { name: 'Chloé Leroy', avatar: 'https://picsum.photos/id/1035/100/100' },
};

export const badges: Badge[] = [
    { id: 'quiz-novice', name: 'Quiz Novice', description: 'Complété 5 quiz', icon: 'star' },
    { id: 'quiz-master', name: 'Quiz Master', description: 'Complété 25 quiz', icon: 'star' },
    { id: 'contest-winner', name: 'Gagnant de Concours', description: 'Remporté une 1ère place', icon: 'trophy' },
    { id: 'tournament-champ', name: 'Champion de Tournoi', description: 'Remporté un tournoi', icon: 'trophy' },
    { id: 'first-match', name: 'Premier Match', description: 'Terminé votre premier match', icon: 'medal' },
    { id: 'high-score', name: 'Meilleur Score', description: 'Obtenu un score de 90%+', icon: 'medal' },
    { id: 'quiz-grandmaster', name: 'Quiz Grand Maître', description: 'Complété 50 quiz', icon: 'star' },
    { id: 'perfect-score', name: 'Score Parfait', description: 'Obtenu un score de 100% dans un quiz difficile', icon: 'medal' }
];

export const currentUser: User = {
    name: 'Camille Bernard',
    avatar: 'https://picsum.photos/id/1027/100/100',
    badges: [badges[0], badges[2], badges[4], badges[6]],
};

// Helper function to generate more data for infinite scroll
const generateExpandedData = <T extends { id: number }>(
    originalData: T[],
    factor: number,
    randomizer: (item: T, i: number, j: number) => T
): T[] => {
    const expanded: T[] = [];
    for (let i = 0; i < factor; i++) {
        originalData.forEach((item, j) => {
            const newItem = randomizer({ ...item }, i, j);
            newItem.id = (originalData.length * i) + j + 1;
            expanded.push(newItem);
        });
    }
    return expanded;
};

// Helper to generate a realistic leaderboard
const generateLeaderboard = (playerPool: Player[], numPlayers: number): LeaderboardEntry[] => {
    const leaderboard: LeaderboardEntry[] = [];
    const shuffledPlayers = [...playerPool].sort(() => 0.5 - Math.random());
    const selectedPlayers = shuffledPlayers.slice(0, numPlayers);

    // Ensure current user is in the leaderboard for demonstration
    if (numPlayers > 0 && !selectedPlayers.some(p => p.name === currentUser.name)) {
        selectedPlayers.pop();
        selectedPlayers.push(players.camille); // currentUser is Camille
        // shuffle again to not always have user at the end
        for (let i = selectedPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]];
        }
    }

    selectedPlayers.forEach((player) => {
        leaderboard.push({
            rank: 0, // Will be set after sorting
            player: player,
            score: Math.floor(Math.random() * 5000) + 4000,
        });
    });

    return leaderboard.sort((a, b) => b.score - a.score).map((entry, index) => ({ ...entry, rank: index + 1 }));
};


const originalQuizQuestions: QuizQuestion[] = [
    { id: 1, category: 'Culture Générale', question: 'Quelle est la capitale de l\'Australie ?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], answer: 'Canberra', difficulty: 'Facile' },
    { id: 2, category: 'Histoire-Géographie', question: 'En quelle année l\'homme a-t-il marché sur la Lune pour la première fois ?', options: ['1965', '1969', '1971', '1972'], answer: '1969', difficulty: 'Facile' },
    { id: 3, category: 'Physique-Chimie', question: 'Quelle est la formule chimique de l\'eau ?', options: ['CO2', 'O2', 'H2O', 'NaCl'], answer: 'H2O', difficulty: 'Facile' },
    { id: 4, category: 'Géographie', question: 'Quel est le plus long fleuve du monde ?', options: ['Le Nil', 'L\'Amazone', 'Le Yangtsé', 'Le Mississippi'], answer: 'L\'Amazone', difficulty: 'Facile' },
    { id: 5, category: 'Culture Générale', question: 'Qui a peint la Mona Lisa ?', options: ['Michel-Ange', 'Raphaël', 'Léonard de Vinci', 'Donatello'], answer: 'Léonard de Vinci', difficulty: 'Facile' },
    { id: 6, category: 'Mathématiques', question: 'Combien font 7 x 8 ?', options: ['49', '54', '56', '64'], answer: '56', difficulty: 'Facile' },
    { id: 7, category: 'Biologie', question: 'Quel est l\'organe principal de la respiration chez l\'homme ?', options: ['Le cœur', 'Les poumons', 'Le foie', 'L\'estomac'], answer: 'Les poumons', difficulty: 'Facile' },
    { id: 8, category: 'Anglais', question: 'What is the past tense of the verb "to go"?', options: ['Gone', 'Goed', 'Went', 'Going'], answer: 'Went', difficulty: 'Facile' },
    { id: 9, category: 'Français', question: 'Quel est le pluriel du mot "cheval" ?', answer: 'Chevaux', difficulty: 'Facile' },
    { id: 10, category: 'Physique', question: 'Quelle loi de Newton stipule que "pour chaque action, il y a une réaction égale et opposée" ?', answer: 'La troisième loi de Newton', difficulty: 'Moyen' },
    { id: 11, category: 'Culture Générale', question: 'Dans quelle ville se trouve la Tour Eiffel ?', options: ['Lyon', 'Marseille', 'Paris', 'Lille'], answer: 'Paris', difficulty: 'Facile' },
    { id: 12, category: 'Mathématiques', question: 'Quelle est la valeur de Pi (π) aux deux premières décimales ?', answer: '3,14', difficulty: 'Facile' },
    { id: 13, category: 'Biologie', question: 'Quel processus les plantes utilisent-elles pour convertir la lumière du soleil en énergie ?', options: ['La respiration', 'La photosynthèse', 'La transpiration', 'La germination'], answer: 'La photosynthèse', difficulty: 'Moyen' },
    { id: 14, category: 'Anglais', question: 'How do you say "Bonjour" in English?', answer: 'Hello or Good morning', difficulty: 'Facile' },
    { id: 15, category: 'Histoire', question: 'Qui était le premier président des États-Unis ?', options: ['Abraham Lincoln', 'Thomas Jefferson', 'George Washington', 'John Adams'], answer: 'George Washington', difficulty: 'Facile' },
    { id: 16, category: 'Physique', question: 'Quel est le symbole chimique de l\'or ?', options: ['Ag', 'Or', 'Au', 'Fe'], answer: 'Au', difficulty: 'Moyen' },
    { id: 17, category: 'Français', question: 'Comment s\'accorde l\'adjectif qualificatif avec le nom qu\'il qualifie ?', answer: 'En genre et en nombre.', difficulty: 'Moyen' },
    { id: 18, category: 'Mathématiques', question: 'Qu\'est-ce qu\'un triangle isocèle ?', answer: 'Un triangle avec deux côtés de même longueur.', difficulty: 'Facile' },
    { id: 19, category: 'Biologie', question: 'Combien de cœurs une pieuvre a-t-elle ?', answer: 'Trois.', difficulty: 'Moyen' },
    { id: 20, category: 'Culture Générale', question: 'Quel est le plus grand océan du monde ?', options: ['L\'océan Atlantique', 'L\'océan Indien', 'L\'océan Arctique', 'L\'océan Pacifique'], answer: 'L\'océan Pacifique', difficulty: 'Facile' },
    { id: 21, category: 'Mathématiques', question: 'Quelle est la forme du graphe de la fonction f(x) = x² ?', options: ['Une droite', 'Un cercle', 'Une hyperbole', 'Une parabole'], answer: 'Une parabole', difficulty: 'Moyen' },
    { id: 22, category: 'Physique-Chimie', question: 'Quelle est la structure électronique de l\'atome de carbone (Z=6) ?', answer: 'La structure électronique est (K)2 (L)4, ce qui signifie 2 électrons sur la première couche (K) et 4 sur la seconde (L).', difficulty: 'Difficile' },
    { id: 23, category: 'Mathématiques', question: 'Trouvez les racines de l\'équation x² - 4 = 0.', options: ['x = 4', 'x = 2', 'x = 2 et x = -2', 'x = 0'], answer: 'x = 2 et x = -2', difficulty: 'Moyen' },
    { id: 24, category: 'Physique-Chimie', question: 'Combien d\'électrons de valence possède un atome de sodium (Na), sachant que Z=11 ?', answer: 'Un seul électron de valence. Sa structure est (K)2 (L)8 (M)1.', difficulty: 'Difficile' },
    { id: 25, category: 'Cinéma', question: 'Quel réalisateur est connu pour le film "Pulp Fiction" ?', options: ['Steven Spielberg', 'Martin Scorsese', 'Quentin Tarantino', 'James Cameron'], answer: 'Quentin Tarantino', difficulty: 'Moyen' },
    { id: 26, category: 'Sport', question: 'En quelle année la France a-t-elle remporté sa deuxième Coupe du Monde de football ?', answer: '2018', difficulty: 'Facile' },
    { id: 27, category: 'Musique', question: 'Quel groupe de rock a composé la chanson "Bohemian Rhapsody" ?', options: ['The Beatles', 'Queen', 'Led Zeppelin', 'The Rolling Stones'], answer: 'Queen', difficulty: 'Facile' },
    { id: 28, category: 'Littérature', question: 'Qui a écrit "L\'Étranger" ?', answer: 'Albert Camus', difficulty: 'Moyen' },
    { id: 29, category: 'Technologie', question: 'Que signifie l\'acronyme "CPU" ?', options: ['Computer Personal Unit', 'Central Processing Unit', 'Central Power Unit', 'Computer Processing Unit'], answer: 'Central Processing Unit', difficulty: 'Facile' },
    { id: 30, category: 'Philosophie', question: 'Quelle est la célèbre phrase de Descartes qui affirme l\'existence par la pensée ?', answer: 'Je pense, donc je suis (Cogito, ergo sum).', difficulty: 'Moyen' },
    { id: 31, category: 'Français', question: 'Quelle est la forme correcte du verbe "pouvoir" au futur simple à la première personne du singulier ?', options: ['Je peux', 'Je pourrai', 'Je pouvais', 'J\'ai pu'], answer: 'Je pourrai', difficulty: 'Moyen' },
];

export const quizQuestions: QuizQuestion[] = generateExpandedData(originalQuizQuestions, 10, (item, i, j) => {
    return item;
});

const now = new Date();
const originalContests: Contest[] = [
    { id: 1, title: 'Concours de Français', subject: 'Français', level: 'Lycée - Seconde', prize: 490000, participants: '28', entryFee: 300, registrationEndDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant' },
    { id: 2, title: 'Concours de Couleurs (Gratuit)', subject: 'Art', level: 'Maternelle', prize: 0, participants: '30', entryFee: 0, registrationEndDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000 + 23 * 3600 * 1000), status: 'upcoming', type: 'gratuit' },
    { id: 3, title: 'Concours de Formes (Payant)', subject: 'Mathématiques', level: 'Maternelle', prize: 5000, participants: '15', entryFee: 500, registrationEndDate: new Date(now.getTime() + 1 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant' },
    { id: 4, title: 'Concours de Histoire-Géographie', subject: 'Histoire-Géographie', level: 'Primaire - CE2', prize: 347000, participants: '+ de 50', entryFee: 700, registrationEndDate: new Date(now.getTime() + 4 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant', estimatedWinnings: { first: 173500, second: 86750, third: 34700 } },
    { id: 5, title: 'Concours d\'Économie', subject: 'Économie', level: 'Lycée - Terminale', prize: 434000, participants: '41', entryFee: 600, registrationEndDate: new Date(now.getTime() - 1 * 3600 * 1000), status: 'live', type: 'payant', estimatedWinnings: { first: 217000, second: 108500, third: 43400 } },
    { id: 6, title: 'Concours d\'Espagnol', subject: 'Espagnol', level: 'Supérieur', prize: 481000, participants: '+ de 100', entryFee: 100, registrationEndDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000), status: 'finished', type: 'payant' },
    { id: 7, title: 'Challenge de Biologie Cellulaire', subject: 'Biologie', level: 'Universitaire', prize: 750000, participants: '18', entryFee: 1500, registrationEndDate: new Date(now.getTime() + 10 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant', estimatedWinnings: { first: 375000, second: 187500, third: 75000 } },
    { id: 8, title: 'Quiz Pop Culture (Gratuit)', subject: 'Culture Générale', level: 'Tous', prize: 10000, participants: '+ de 200', entryFee: 0, registrationEndDate: new Date(now.getTime() + 1 * 24 * 3600 * 1000), status: 'upcoming', type: 'gratuit' },
    { id: 9, title: 'Concours de Programmation', subject: 'Technologie', level: 'Supérieur', prize: 1000000, participants: '35', entryFee: 2000, registrationEndDate: new Date(now.getTime() - 5 * 3600 * 1000), status: 'live', type: 'payant' },
    { id: 10, title: 'Concours de Littérature Classique', subject: 'Français', level: 'Lycée', prize: 250000, participants: '60', entryFee: 400, registrationEndDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000), status: 'finished', type: 'payant' },
];

export const contests: Contest[] = generateExpandedData(originalContests, 6, (item, i, j) => {
    const statuses: Array<'upcoming' | 'live' | 'finished'> = ['upcoming', 'live', 'finished'];
    item.status = statuses[(i + j) % 3];
    const participantCount = Math.floor(Math.random() * 100) + (item.participants.includes('+') ? 100 : 20);
    item.participants = `${participantCount}`;
    item.prize = Math.max(0, item.prize + Math.floor(Math.random() * 20000 - 10000));
    item.registrationEndDate = new Date(now.getTime() + (Math.random() * 10 - 3) * 24 * 3600 * 1000);
    
    if (item.status !== 'upcoming') {
        item.leaderboard = generateLeaderboard(Object.values(players), Math.min(participantCount, 50));
    } else {
        item.leaderboard = undefined;
    }

    return item;
});

// FIX: Added missing 'originalTournaments' definition to resolve reference error.
const originalTournaments: Contest[] = [
    { id: 1, title: 'Grand Tournoi de Mathématiques', subject: 'Mathématiques', level: 'Lycée', prize: 2000000, participants: '+ de 100', entryFee: 5000, registrationEndDate: new Date(now.getTime() + 15 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant', estimatedWinnings: { first: 1000000, second: 500000, third: 250000 } },
    { id: 2, title: 'Tournoi National de Physique', subject: 'Physique-Chimie', level: 'Supérieur', prize: 5000000, participants: '+ de 200', entryFee: 10000, registrationEndDate: new Date(now.getTime() + 20 * 24 * 3600 * 1000), status: 'upcoming', type: 'payant', estimatedWinnings: { first: 2500000, second: 1250000, third: 625000 } },
    { id: 3, title: 'Tournoi Francophone de Culture G', subject: 'Culture Générale', level: 'Tous', prize: 1000000, participants: '+ de 500', entryFee: 1000, registrationEndDate: new Date(now.getTime() - 3 * 24 * 3600 * 1000), status: 'finished', type: 'payant' },
    { id: 4, title: 'Tournoi des Champions d\'Histoire', subject: 'Histoire-Géographie', level: 'Universitaire', prize: 3000000, participants: '80', entryFee: 7500, registrationEndDate: new Date(now.getTime() - 2 * 3600 * 1000), status: 'live', type: 'payant' }
];

export const tournaments: Contest[] = generateExpandedData(originalTournaments, 8, (item, i, j) => {
    const statuses: Array<'upcoming' | 'live' | 'finished'> = ['upcoming', 'live', 'finished'];
    item.status = statuses[(i + j) % 3];
    const participantCount = Math.floor(Math.random() * 150) + (item.participants.includes('+') ? 150 : 50);
    item.participants = `${participantCount}`;
    item.prize = Math.max(100000, item.prize + Math.floor(Math.random() * 50000 - 25000));
    item.registrationEndDate = new Date(now.getTime() + (Math.random() * 15 - 4) * 24 * 3600 * 1000);

    if (item.status !== 'upcoming') {
        item.leaderboard = generateLeaderboard(Object.values(players), Math.min(participantCount, 100));
    } else {
        item.leaderboard = undefined;
    }

    return item;
});

const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
tomorrow.setHours(14, 0, 0, 0);

// FIX: Added missing 'originalMatches' definition to resolve reference error.
const originalMatches: Match[] = [
    { id: 1, subject: 'Mathématiques', level: 'Lycée - Première', player1: players.camille, player2: players.hugo, status: 'finished', winner: 'player1', time: 'il y a 2 j', date: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(), wager: 1500, performance: { player1: { correctAnswers: 9, totalQuestions: 10, completionTime: 75 }, player2: { correctAnswers: 7, totalQuestions: 10, completionTime: 92 }}},
    { id: 2, subject: 'Physique-Chimie', level: 'Supérieur', player1: players.moussa, player2: players.lea, status: 'live', time: 'En direct', date: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), wager: 5000 },
    { id: 3, subject: 'Culture Générale', level: 'Tous', player1: players.manon, player2: { name: 'Adversaire', avatar: '' }, status: 'challenge', time: 'Défi ouvert', date: new Date(now.getTime() - 3600 * 1000).toISOString(), wager: 500 },
    { id: 4, subject: 'Anglais', level: 'Secondaire - 4ème', player1: players.julien, player2: players.aissatou, status: 'upcoming', time: `Demain à 14:00`, date: tomorrow.toISOString(), wager: 1000 },
    { id: 5, subject: 'Histoire-Géographie', level: 'Lycée - Terminale', player1: players.amine, player2: players.fatou, status: 'finished', winner: 'player2', time: 'il y a 1 j', date: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(), wager: 2000, performance: { player1: { correctAnswers: 8, totalQuestions: 10, completionTime: 110 }, player2: { correctAnswers: 8, totalQuestions: 10, completionTime: 95 }}},
    { id: 6, subject: 'Français', level: 'Primaire - CM2', player1: players.yann, player2: { name: 'Adversaire', avatar: '' }, status: 'challenge', time: 'Défi ouvert', date: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(), wager: 250 },
    { id: 7, subject: 'Maths', level: 'Lycée', player1: players.hugo, player2: players.camille, status: 'challenge', time: 'Proposé il y a 5 min', date: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), wager: 1000 },
];

const playerKeys = Object.keys(players);

export const matches: Match[] = generateExpandedData(originalMatches, 20, (item, i, j) => {
    const gen_now = new Date();
    const statuses: Array<'challenge' | 'live' | 'finished' | 'upcoming'> = ['challenge', 'live', 'finished', 'upcoming'];
    item.status = statuses[(i + j) % 4];
    item.wager = Math.max(0, item.wager + Math.floor(Math.random() * 1000 - 500));

    // FIX: Preserve players for P2P matches from original data. For open challenges, find a random opponent.
    const isP2PMatch = item.player2 && item.player2.name !== 'Adversaire';
    if (!isP2PMatch) {
        // This is an open challenge. Keep player1 and find a random player2.
        const p1Name = item.player1.name;
        let p2: Player;
        do {
            p2 = players[playerKeys[Math.floor(Math.random() * playerKeys.length)]];
        } while (p2.name === p1Name);
        item.player2 = p2;
    }
    // For P2P matches, players are preserved from the original data.


    if (item.status === 'finished') {
        const daysAgo = Math.floor(Math.random() * 5) + 1;
        item.time = `il y a ${daysAgo} j`;
        item.date = new Date(gen_now.getTime() - daysAgo * 24 * 3600 * 1000).toISOString();
        item.winner = Math.random() > 0.5 ? 'player1' : 'player2';
        
        // Add mock performance data for generated finished matches
        const p1Correct = Math.floor(Math.random() * 9) + 2; // 2-10
        const p2Correct = Math.floor(Math.random() * 9) + 2; // 2-10
        const p1Time = Math.floor(Math.random() * 60) + 60; // 60-120s
        const p2Time = Math.floor(Math.random() * 60) + 60; // 60-120s

        item.performance = {
            player1: { correctAnswers: p1Correct, totalQuestions: 10, completionTime: p1Time },
            player2: { correctAnswers: p2Correct, totalQuestions: 10, completionTime: p2Time },
        };
        // Ensure winner has better stats
        if (item.winner === 'player1') {
            if (p1Correct < p2Correct) item.performance.player1.correctAnswers = p2Correct + 1;
            if (p1Correct === p2Correct && p1Time > p2Time) item.performance.player1.completionTime = p2Time - 10;
        } else {
            if (p2Correct < p1Correct) item.performance.player2.correctAnswers = p1Correct + 1;
            if (p2Correct === p1Correct && p2Time > p1Time) item.performance.player2.completionTime = p1Time - 10;
        }


    } else if (item.status === 'live') {
        item.time = 'En direct';
        item.date = new Date(gen_now.getTime() - (Math.random() * 10 * 60 * 1000)).toISOString();
        item.winner = undefined;
        item.performance = undefined;
    } else {
        item.winner = undefined;
        item.performance = undefined;
        const isOpenChallenge = item.player2.name === 'Adversaire';

        if (item.status === 'challenge') {
            const minutesAgo = Math.floor(Math.random() * 59) + 1;
            item.time = isOpenChallenge ? 'Défi ouvert' : `Proposé il y a ${minutesAgo} min`;
            item.date = new Date(gen_now.getTime() - minutesAgo * 60 * 1000).toISOString();
        } else { // upcoming
            const futureHours = Math.floor(Math.random() * 48) + 1;
            const futureDate = new Date(gen_now.getTime() + futureHours * 60 * 60 * 1000);
            item.date = futureDate.toISOString();

            const hours = futureDate.getHours().toString().padStart(2, '0');
            const minutes = futureDate.getMinutes().toString().padStart(2, '0');

            if (futureDate.toDateString() === gen_now.toDateString()) {
                item.time = `Aujourd'hui à ${hours}:${minutes}`;
            }
            else if (futureDate.toDateString() === new Date(gen_now.getTime() + 24 * 60 * 60 * 1000).toDateString()) {
                item.time = `Demain à ${hours}:${minutes}`;
            }
            else {
                item.time = `Le ${futureDate.toLocaleString('fr-FR', { day: 'numeric', month: 'short' })} à ${hours}:${minutes}`;
            }
        }
    }
    return item;
});


export const notifications: Notification[] = [
    {id: 1, type: 'match', text: 'Votre match contre Léa Dupont en Droit commence dans 15 minutes !', time: 'maintenant', read: false },
    {id: 2, type: 'match', text: 'Votre match en direct contre Aïssatou Diallo en Philosophie est en cours. Rejoignez maintenant !', time: 'il y a 2 min', read: false },
    {id: 3, type: 'challenge', text: 'Hugo Petit vous a défié en Maths pour 1000 F CFA.', time: 'il y a 5 min', read: false, matchId: 7 },
    {id: 4, type: 'quiz', text: 'Fumi vous suggère un quiz en Histoire-Géographie (Niveau Lycée).', time: 'il y a 2h', read: false },
    {id: 5, type: 'contest', text: 'Nouveau concours de Culture Générale ! Tentez de gagner plus de 50 000 F CFA.', time: 'il y a 8h', read: true },
    {id: 6, type: 'win', text: 'Vous avez gagné votre match contre Léa Dupont ! + 1 400 F CFA ici', time: 'il y a 2h', read: true },
    {id: 7, type: 'loss', text: 'Vous avez perdu votre match contre Julien Martin.', time: 'il y a 2 jours', read: true },
];