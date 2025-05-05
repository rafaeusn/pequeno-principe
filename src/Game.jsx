import React, { useRef, useEffect } from "react";
import p5 from "p5";
import gsap from "gsap";
import Prince from './Prince';
import Planet from './Planet';

const Game = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const phrases = [
      "Tu te tornas eternamente responsável por aquilo que cativas.",
      "O essencial é invisível aos olhos.",
      "Só se vê bem com o coração.",
      "Você se torna eternamente responsável por aquilo que cativa.",
      "É preciso que eu suporte duas ou três larvas se quiser conhecer as borboletas.",
      "É o tempo que você perdeu com sua rosa que faz sua rosa tão importante.",
      "Você é eternamente responsável por aquilo que cativa.",
      "O que torna belo o deserto é que ele esconde um poço em algum lugar.",
      "As estrelas são lindas, por causa de uma flor que não vemos.",
      "A verdadeira beleza está nos olhos de quem vê."
    ];

    let godImage;

    const p = new p5((s) => {
      let currentPlanet, nextPlanet;
      let prince;
      let transitioning = false;
      let yOffset = 0;
      let stars = [];
      const numStars = 2333;
      let score = 0;
      let rotationSpeed = 0.8;

      let timeOutsideOrbit = 0;
      const timeLimit = 3000;

      let perdeu = false;
      let fadeAlpha = 0;
      let startFadeOut = false;

      let camZoom = 1;
      let targetZoom = 1;

      let message = "";
      let messageVisible = false;
      let messageStartTime = 0;
      let messageDuration = 3000;
      let messageAlpha = 1;
      let fadeOutMessage = false;

      s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight);
        s.angleMode(s.RADIANS);
        s.ellipseMode(s.CENTER);

        for (let i = 0; i < numStars; i++) {
          stars.push(createStar());
        }

        s.loadImage("/assets/coroa.png", (img) => {
          godImage = img;
        
          currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100);
          nextPlanet = Planet.generateNext(s, currentPlanet);
          prince = new Prince(s, currentPlanet, godImage);
        });
        
      };

      s.draw = () => {
        if (!godImage || !prince || !currentPlanet || !nextPlanet) return;

        s.background(0);

        if (!perdeu && s.random() < 0.004) {
          stars.push({
            x: s.random(s.width),
            y: -20,
            vx: s.random(-6, -10),
            vy: s.random(6, 10),
            size: s.random(2, 4),
            life: 60,
            isShooting: true,
            brightnessOffset: s.random(1000),
            parallax: s.random(0.1, 0.3)
          });
        }

        yOffset = prince.pos.y - s.height / 2;

        s.noStroke();
        stars = stars.filter(star => {
          if (star.isShooting) {
            star.x += star.vx;
            star.y += star.vy;
            star.life--;
            s.fill(255, 255, 200, s.map(star.life, 0, 60, 0, 255));
            s.circle(star.x, star.y - yOffset * star.parallax, star.size);
            return star.life > 0;
          } else {
            const brightness = 150 + 105 * s.sin(s.frameCount * 0.01 + star.brightnessOffset);
            s.fill(brightness + s.random(-10, 10));
            const sx = star.x;
            const sy = star.y - yOffset * star.parallax;
            if (sy > s.height + 20 || sx < -20 || sx > s.width + 20) {
              Object.assign(star, createStar());
              return true;
            }
            s.circle(sx, sy, star.size);
            return true;
          }
        });

        s.push();

        targetZoom = prince.onPlanet ? 1 : 1.5;
        camZoom += (targetZoom - camZoom) * 0.05;

        s.translate(s.width / 2, s.height / 2);
        s.scale(camZoom);
        s.translate(-prince.pos.x, -prince.pos.y);

        currentPlanet.update();
        currentPlanet.show();

        if (nextPlanet) {
          nextPlanet.update();
          nextPlanet.show();
        }

        prince.update();
        prince.show();

        if (!prince.onPlanet && prince.hits(nextPlanet)) {
          prince.land(nextPlanet);
          transitioning = true;
          score++;
          if (score % 3 === 0) {
            showRandomPhrase();
          }
          if (score >= 5) {
            rotationSpeed += 0.02;
          }
          setTimeout(() => {
            currentPlanet = nextPlanet;
            nextPlanet = Planet.generateNext(s, currentPlanet);
            transitioning = false;
          }, 1500);
        }

        s.pop();

        if (!prince.onPlanet && !perdeu) {
          timeOutsideOrbit += s.deltaTime;
          if (timeOutsideOrbit >= timeLimit) {
            perdeu = true;
            timeOutsideOrbit = 0;
            setTimeout(() => {
              startFadeOut = true;
            }, 800);
          }
        } else if (prince.onPlanet) {
          timeOutsideOrbit = 0;
        }

        s.fill(255);
        s.textSize(32);
        s.textAlign(s.RIGHT, s.TOP);
        s.text(`Pontuação: ${score}`, s.width - 20, 20);

        if (perdeu) {
          s.fill(255);
          s.textSize(48);
          s.textAlign(s.CENTER, s.CENTER);
          s.text("Se perdeu na imensidão do espaço...", s.width / 2, s.height / 2);
        }

        if (startFadeOut) {
          fadeAlpha += 4;
          s.fill(0, fadeAlpha);
          s.noStroke();
          s.rect(0, 0, s.width, s.height);

          if (fadeAlpha >= 255) {
            reiniciarJogo();
          }
        }

        if (messageVisible || fadeOutMessage) {
          s.push();
          s.resetMatrix();
          s.fill(0, 180 * messageAlpha);
          s.noStroke();
          s.rect(0, s.height - 80, s.width, 80);

          s.fill(255, 255 * messageAlpha);
          s.textSize(26);
          s.textAlign(s.CENTER, s.CENTER);
          s.text(message, s.width / 2, s.height - 40);
          s.pop();
        }
      };

      s.mousePressed = () => {
        if (prince && prince.onPlanet && !transitioning && !perdeu) {
          prince.launch();
        }
      };
      

      s.windowResized = () => {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
      };

      function reiniciarJogo() {
        score = 0;
        rotationSpeed = 0.08;
        timeOutsideOrbit = 0;
        perdeu = false;
        fadeAlpha = 0;
        startFadeOut = false;

        stars = [];
        for (let i = 0; i < numStars; i++) {
          stars.push(createStar());
        }

        currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100);
        nextPlanet = Planet.generateNext(s, currentPlanet);
        prince = new Prince(s, currentPlanet, godImage);
      }

      function createStar() {
        return {
          x: s.random(-s.width, s.width * 2),
          y: s.random(-5000, 3000),
          size: s.random(0.3, 5),
          parallax: s.random(0.05, 0.6),
          brightnessOffset: s.random(1000),
          isShooting: false
        };
      }

      function showRandomPhrase() {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        const phrase = phrases[randomIndex];

        message = "";
        messageVisible = true;
        messageAlpha = 1;
        fadeOutMessage = false;
        messageStartTime = s.millis();
        messageDuration = Math.max(phrase.length * 80, 5000);

        const textObj = { textIndex: 0 };

        gsap.fromTo(
          textObj,
          { textIndex: 0 },
          {
            textIndex: phrase.length,
            duration: phrase.length * 0.08,
            ease: "none",
            onUpdate: () => {
              message = phrase.substring(0, Math.floor(textObj.textIndex));
            },
            onComplete: () => {
              setTimeout(() => {
                fadeOutMessage = true;
                gsap.to({ alpha: 1 }, {
                  alpha: 0,
                  duration: 1.5,
                  onUpdate: function () {
                    messageAlpha = this.targets()[0].alpha;
                  },
                  onComplete: () => {
                    messageVisible = false;
                    fadeOutMessage = false;
                    messageAlpha = 1;
                    message = "";
                  }
                });
              }, messageDuration - (phrase.length * 80));
            }
          }
        );
      }

    }, sketchRef.current);

    return () => {
      p.remove();
    };
  }, []);

  return <div ref={sketchRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default Game;
