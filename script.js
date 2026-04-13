const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');

let gameMode = 'bot';
let active = false;

function goMenu(menu, mode){
    gameMode = mode;
    document.getElementById('startMenu').style.display='none';
    document.getElementById('teamMenu').style.display='flex';
    history.pushState({}, "", "#team");
}

function startGame(){
    document.getElementById('ui-wrapper').style.display='none';
    document.getElementById('game-container').style.display='block';
    setupMatch();
}

const p1 = {x:200,y:300,st:100,color:'blue'};
const p2 = {x:800,y:300,st:100,color:'red'};

const ball = {x:500,y:300,dx:0,dy:0,owner:null};

const keys={};
onkeydown=e=>keys[e.code]=true;
onkeyup=e=>keys[e.code]=false;

function setupMatch(){
    p1.x=200+Math.random()*100;
    p2.x=700+Math.random()*100;
}

function move(p,up,down,left,right,sprint){
    let speed = keys[sprint]?6:3;
    if(keys[up])p.y-=speed;
    if(keys[down])p.y+=speed;
    if(keys[left])p.x-=speed;
    if(keys[right])p.x+=speed;
}

function bot(){
    let target = ball.owner===p2 ? {x:50,y:300} : ball;
    let dx=target.x-p2.x;
    let dy=target.y-p2.y;
    let dist=Math.hypot(dx,dy);
    p2.x+=dx/dist*3;
    p2.y+=dy/dist*3;

    if(ball.owner===p2 && p2.x<200){
        ball.dx=-15;
        ball.dy=(Math.random()-0.5)*6;
        ball.owner=null;
    }
}

function physics(){
    if(!ball.owner){
        ball.x+=ball.dx;
        ball.y+=ball.dy;
        ball.dx*=0.99;
        ball.dy*=0.99;
    }

    [p1,p2].forEach(p=>{
        let d=Math.hypot(ball.x-p.x,ball.y-p.y);
        if(d<30){
            ball.owner=p;
        }
    });

    if(ball.owner){
        ball.x=ball.owner.x+(ball.owner===p1?30:-30);
        ball.y=ball.owner.y;
    }
}

function draw(){
    ctx.fillStyle="#14532d";
    ctx.fillRect(0,0,1000,600);

    ctx.beginPath();
    ctx.moveTo(500,0);
    ctx.lineTo(500,600);
    ctx.stroke();

    [p1,p2].forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,25,0,Math.PI*2);
        ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(ball.x,ball.y,10,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();

    move(p1,'KeyW','KeyS','KeyA','KeyD','ShiftLeft');
    if(gameMode==='pvp'){
        move(p2,'ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftRight');
    } else bot();

    physics();

    requestAnimationFrame(draw);
}

draw();