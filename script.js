const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');

const teams = [
    { name: 'Аргентина', color: '#74ACDF', star: '10' }, { name: 'Франция', color: '#002395', star: '10' },
    { name: 'Украина', color: '#FFD700', star: '11' }, { name: 'Россия', color: '#E00000', star: '17' },
    { name: 'Бразилия', color: '#FFDF00', star: '7' }, { name: 'Германия', color: '#FFFFFF', star: '10' },
    { name: 'Испания', color: '#C60B1E', star: '19' }, { name: 'Португалия', color: '#E00000', star: '7' },
    { name: 'Англия', color: '#FFFFFF', star: '9' }, { name: 'Нидерланды', color: '#F36C21', star: '11' },
    { name: 'Бельгия', color: '#6D202F', star: '7' }, { name: 'Италия', color: '#004BB3', star: '14' },
    { name: 'Япония', color: '#000040', star: '10' }, { name: 'Хорватия', color: '#FF0000', star: '10' },
    { name: 'Уругвай', color: '#5DBBFF', star: '15' }, { name: 'Марокко', color: '#C1272D', star: '2' }
];

let sel1 = teams[0], sel2 = teams[1], gameMode = 'bot', active = false, paused = false, tourneyData = null;
const ball = { x: 500, y: 300, r: 10, dx: 0, dy: 0, owner: null, lock: 0 };
const p1 = { x: 200, y: 300, r: 25, s: 0, st: 100, ex: false, team: null };
const p2 = { x: 800, y: 300, r: 25, s: 0, st: 100, ex: false, team: null };
const keys = {};

window.onkeydown = e => { 
    keys[e.code] = true; 
    if(e.code === 'Escape' && active) togglePause(); 
};
window.onkeyup = e => keys[e.code] = false;

function setPlayerCount(m) {
    gameMode = m; document.getElementById('startMenu').style.display = 'none';
    document.getElementById('teamMenu').style.display = 'flex';
    document.getElementById('p2-box').style.display = (m === 'pvp' ? 'block' : 'none');
    initGrids();
}

function initGrids() {
    const g1 = document.getElementById('g1'), g2 = document.getElementById('g2');
    [g1, g2].forEach((g, idx) => {
        g.innerHTML = '';
        teams.forEach(t => {
            const c = document.createElement('div'); c.className = 't-card'; c.innerText = t.name;
            c.onclick = () => {
                Array.from(g.children).forEach(el => el.classList.remove(idx===0?'sel-p1':'sel-p2'));
                c.classList.add(idx===0?'sel-p1':'sel-p2');
                if(idx===0) sel1 = t; else sel2 = t;
            };
            g.appendChild(c);
        });
    });
}

function startMode(type) {
    document.getElementById('teamMenu').style.display = 'none';
    if(type === 'quick') { setupMatch(sel1, sel2); } 
    else {
        const shuf = [...teams].sort(() => Math.random()-0.5);
        tourneyData = {
            groups: [
                { id: 'A', teams: shuf.slice(0,4).map(t => ({...t, pts: 0})) },
                { id: 'B', teams: shuf.slice(4,8).map(t => ({...t, pts: 0})) },
                { id: 'C', teams: shuf.slice(8,12).map(t => ({...t, pts: 0})) },
                { id: 'D', teams: shuf.slice(12,16).map(t => ({...t, pts: 0})) }
            ],
            matches: []
        };
        tourneyData.groups.forEach(g => {
            for(let i=0; i<4; i++) for(let j=i+1; j<4; j++) tourneyData.matches.push({t1: g.teams[i], t2: g.teams[j], played: false});
        });
        showTable();
    }
}

function showTable() {
    document.getElementById('tourneyMenu').style.display = 'flex';
    const cont = document.getElementById('tableContent'); cont.innerHTML = '';
    tourneyData.groups.forEach(g => {
        g.teams.sort((a,b) => b.pts - a.pts);
        let h = `<div class="group-box"><b>Гр ${g.id}</b><br>`;
        g.teams.forEach(t => h += `${t.name}: ${t.pts}<br>`);
        cont.innerHTML += h + `</div>`;
    });
}

function processNext() {
    const m = tourneyData.matches.find(x => !x.played);
    if(!m) {
        document.getElementById('tourneyMenu').style.display = 'none';
        document.getElementById('winScreen').style.display = 'flex';
        const best = tourneyData.groups.flatMap(g => g.teams).sort((a,b) => b.pts - a.pts);
        document.getElementById('winnerName').innerText = "ЧЕМПИОН: " + best[0].name;
        return;
    }
    const isPlayer = (m.t1.name === sel1.name || m.t2.name === sel1.name) || (gameMode === 'pvp' && (m.t1.name === sel2.name || m.t2.name === sel2.name));
    if(isPlayer) { document.getElementById('tourneyMenu').style.display = 'none'; setupMatch(m.t1, m.t2, m); } 
    else {
        m.played = true; Math.random() > 0.5 ? m.t1.pts += 3 : m.t2.pts += 3;
        document.getElementById('matchLog').innerText = `Матч: ${m.t1.name} vs ${m.t2.name} завершен`;
        showTable();
    }
}

function setupMatch(t1, t2, mData = null) {
    p1.team = t1; p2.team = t2; p1.s = p2.s = 0; p1.st = p2.st = 100; p1.ex = p2.ex = false;
    p1.matchData = mData;
    document.getElementById('tName1').innerText = t1.name;
    document.getElementById('tName2').innerText = t2.name;
    document.getElementById('game-container').style.display = 'block';
    resetB(); active = true;
}

function update() {
    if(!active || paused) return;

    let s1 = move(p1, 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'ShiftLeft', 'Space', 1);
    if(gameMode === 'pvp') move(p2, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftRight', 'Enter', -1);
    else { 
        let targetX = ball.x + ball.dx * 8; let targetY = ball.y + ball.dy * 8;
        p2.x += (targetX - p2.x) * 0.035; p2.y += (targetY - p2.y) * 0.045;
        if(ball.owner === p2) { p2.x -= 4; if(p2.x < 450) { ball.dx = -22; ball.dy = (Math.random()-0.5)*10; ball.owner = null; ball.lock = 40; } }
    }

    if(Math.hypot(p1.x - p2.x, p1.y - p2.y) < p1.r + p2.r + 5 && ball.owner) {
        ball.dx = (Math.random()-0.5)*20; ball.dy = (Math.random()-0.5)*20; ball.owner = null; ball.lock = 45;
    }

    ball.x += ball.dx; ball.y += ball.dy; ball.dx *= 0.98; ball.dy *= 0.98;
    if(ball.y < 25 || ball.y > 575) ball.dy *= -0.8;

    if(ball.x < 15 || ball.x > 985) {
        if(ball.y > 220 && ball.y < 380) {
            ball.x < 15 ? p2.s++ : p1.s++;
            if(p1.s >= 5 || p2.s >= 5) finishMatch(); else resetB();
        } else ball.dx *= -1;
    }

    if(ball.lock > 0) ball.lock--;
    [p1, p2].forEach(p => {
        // Увеличен радиус захвата для своей вратарской
        let grabDist = (p === p1 && p.x < 120) || (p === p2 && p.x > 880) ? p.r + ball.r + 15 : p.r + ball.r;
        if(Math.hypot(ball.x - p.x, ball.y - p.y) < grabDist && ball.lock <= 0) { ball.owner = p; }
    });

    if(ball.owner) {
        ball.x = ball.owner.x + (ball.owner === p1 ? 32 : -32); ball.y = ball.owner.y; ball.dx = ball.dy = 0;
        // АВТО-ОТБИВАНИЕ ВРАТАРЯ
        if((ball.owner === p1 && p1.x < 100) || (ball.owner === p2 && p2.x > 900)) {
            ball.dx = (ball.owner === p1 ? 26 : -26); ball.dy = (Math.random()-0.5)*12; ball.owner = null; ball.lock = 30;
        }
    }
    [p1, p2].forEach(p => { p.x = Math.max(p.r, Math.min(1000-p.r, p.x)); p.y = Math.max(p.r, Math.min(600-p.r, p.y)); });
}

function move(p, u, d, l, r, sh, sp, dir) {
    let spr = keys[sh] && p.st > 0 && !p.ex;
    let s = (spr ? 7 : 4.2) * (p.ex ? 0.5 : 1);
    if(keys[u]) p.y -= s; if(keys[d]) p.y += s; if(keys[l]) p.x -= s; if(keys[r]) p.x += s;
    if(spr && (keys[u]||keys[d]||keys[l]||keys[r])) p.st -= 0.8; else p.st = Math.min(100, p.st + 0.25);
    if(p.st <= 0) p.ex = true; if(p.st > 20) p.ex = false;
    if(keys[sp] && ball.owner === p && !((p === p1 && p.x > 900) || (p === p2 && p.x < 100))) {
        ball.dx = 22 * dir; ball.dy = (Math.random()-0.5)*10; ball.owner = null; ball.lock = 35;
    }
    return s;
}

function finishMatch() {
    active = false; document.getElementById('game-container').style.display = 'none';
    if(p1.matchData) {
        p1.matchData.played = true;
        if(p1.s > p2.s) tourneyData.groups.flatMap(g=>g.teams).find(t=>t.name===p1.team.name).pts += 3;
        else if(p2.s > p1.s) tourneyData.groups.flatMap(g=>g.teams).find(t=>t.name===p2.team.name).pts += 3;
        showTable();
    } else {
        document.getElementById('winScreen').style.display = 'flex';
        document.getElementById('winnerName').innerText = p1.s > p2.s ? p1.team.name : p2.team.name;
    }
}

function draw() {
    ctx.clearRect(0,0,1000,600);
    ctx.fillStyle = '#14532d'; ctx.fillRect(0,0,1000,600);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.strokeRect(10,10,980,580); ctx.moveTo(500,10); ctx.lineTo(500,590); 
    ctx.arc(500,300,80,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.strokeRect(0, 150, 100, 300); ctx.strokeRect(900, 150, 100, 300); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 220, 15, 160); ctx.fillRect(985, 220, 15, 160);
    [p1, p2].forEach(p => { 
        if(p.team) {
            ctx.fillStyle = p.team.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.textAlign='center'; ctx.fillText(p.team.star, p.x, p.y+7);
        }
    });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    document.getElementById('sc1').innerText = p1.s; document.getElementById('sc2').innerText = p2.s;
    document.getElementById('sb1').style.width = p1.st + '%'; document.getElementById('sb2').style.width = p2.st + '%';
    update(); requestAnimationFrame(draw);
}

function resetB() {
    ball.x = 500; ball.y = 300; ball.dx = ball.dy = 0; ball.owner = null; ball.lock = 0;
    p1.x = 100 + Math.random()*200; p1.y = 100 + Math.random()*400;
    p2.x = 700 + Math.random()*200; p2.y = 100 + Math.random()*400;
}
function togglePause() { paused = !paused; document.getElementById('pauseMenu').style.display = paused?'flex':'none'; }
draw();
