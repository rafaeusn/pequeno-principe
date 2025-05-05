export default class Planet {
  constructor(s, x, y, r, isAppearing = false) {
    if (!s || typeof s.push !== 'function') {
      throw new Error("O objeto 's' não é uma instância válida do p5.");
    }
    this.s = s;
    this.x = x;
    this.y = y;
    this.r = r;
    this.rotation = 0;
    this.opacity = isAppearing ? 0 : 255;
    this.isAppearing = isAppearing;
  }

  update(currentPlanet, prince, rotationSpeed) {
    this.rotation += rotationSpeed;
    if (this === currentPlanet && !prince.onPlanet) {
      this.opacity = Math.max(0, this.opacity - 5);
    }
    if (this.isAppearing && this.opacity < 255) {
      this.opacity = Math.min(255, this.opacity + 5);
    }
  }

  show() {
    const s = this.s;
    s.push();
    s.translate(this.x, this.y);
    s.rotate(this.rotation);
    s.noStroke();
    s.fill(120, 100, 255, this.opacity);
    s.ellipse(0, 0, this.r * 2);
    s.pop();
  }

  static generateNext(s, fromPlanet) {
    const sizes = ["pequeno","médio","grande"];
    const size = s.random(sizes);
    const angle = s.random(s.PI/4, 3*s.PI/4);
    let distance, sizeFactor, baseSize;
    if (size === "pequeno") { sizeFactor=0.7; baseSize=60; distance=s.random(200,450);
    } else if (size === "médio") { sizeFactor=1.2; baseSize=75; distance=s.random(400,600);
    } else { sizeFactor=1.5; baseSize=80; distance=s.random(550,650); }
    let x,y,r; const minDistance=100; let attempts=0, valid=false;
    while(!valid && attempts<10) {
      x = fromPlanet.x + s.cos(angle)*distance;
      y = fromPlanet.y - s.sin(angle)*distance;
      r = baseSize*sizeFactor;
      if (s.dist(x,y,fromPlanet.x,fromPlanet.y) >= minDistance) valid=true;
      else { distance+=20; attempts++; }
    }
    return new Planet(s,x,y,r,true);
  }
}