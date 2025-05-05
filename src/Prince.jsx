import p5 from "p5";
export default class Prince {
  constructor(s, planet, godImage) {
    this.s = s;
    this.angle = 0;
    this.orbitRadius = planet.r + 30;
    this.speed = 0.02;
    this.pos = s.createVector(planet.x + this.orbitRadius, planet.y);
    this.vel = s.createVector(0, 0);
    this.onPlanet = true;
    this.planet = planet;
    this.trail = [];
    this.maxTrailLength = 30;
    this.godImage = godImage;
  }

  update() {
    if (this.onPlanet) {
      this.angle += this.speed;
      this.pos.x = this.planet.x + this.s.cos(this.angle) * this.orbitRadius;
      this.pos.y = this.planet.y + this.s.sin(this.angle) * this.orbitRadius;
    } else {
      this.pos.add(this.vel);
    }
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.maxTrailLength) this.trail.shift();
  }

  show() {
    const s = this.s;
    if (!this.godImage) return;
    if (this.onPlanet) {
      for (let i = 0; i < this.trail.length; i++) {
        const pos = this.trail[i];
        const angle = this.angle + s.HALF_PI;
        const offset = s.createVector(s.cos(angle), s.sin(angle)).mult(-33);
        const trailPos = p5.Vector.add(pos, offset);
        const alpha = s.map(i, 0, this.trail.length, 20, 750);
        s.noStroke();
        s.fill(255,255,100,alpha);
        s.ellipse(trailPos.x, trailPos.y, 3);
      }
    }
    s.push();
    s.translate(this.pos.x, this.pos.y);
    s.rotate(this.angle - s.HALF_PI + s.PI);
    s.imageMode(s.CENTER);
    s.image(this.godImage, 0, 0, 50, 50);
    s.pop();
  }

  launch() {
    const dir = this.s.createVector(
      this.pos.x - this.planet.x,
      this.pos.y - this.planet.y
    ).normalize();
    this.vel = dir.mult(4);
    this.onPlanet = false;
  }

  hits(planet) {
    const d = this.s.dist(this.pos.x, this.pos.y, planet.x, planet.y);
    return d < planet.r;
  }

  land(planet) {
    this.planet = planet;
    this.angle = 0;
    this.orbitRadius = planet.r + 30;
    this.onPlanet = true;
  }
}
