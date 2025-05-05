import React, { useRef, useEffect } from "react";
import p5 from "p5";
import Prince from './Prince';
import Planet from './Planet';

const Game = () => {
  const sketchRef = useRef();

  useEffect(() => {
    const phrases = [
      "Tu te tornas eternamente responsável por aquilo que cativas.",
      "O essencial é invisível aos olhos.",
      "Só se vê bem com o coração.",
      "É o tempo que você perdeu com sua rosa que faz sua rosa tão importante.",
      "O que torna belo o deserto é que ele esconde um poço em algum lugar.",
      "As estrelas são lindas, por causa de uma flor que não vemos.",
      "A verdadeira beleza está nos olhos de quem vê."
    ];

    let godImage;
    let planetImage;

    const p = new p5((s) => {
      let currentPlanet, nextPlanet, prince;
      let transitioning = false;
      let stars = [];
      const numStars = 1000;
      let score = 0;
      let rotationSpeed = 0.01;
      let timeOutsideOrbit = 0;
      const timeLimit = 2333;
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

        s.loadImage("/assets/planeta.png", (img) => {
          planetImage = img;
          s.loadImage("/assets/coroa.png", (godImg) => {
            godImage = godImg;
            currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100, false, planetImage);
            nextPlanet = Planet.generateNext(s, currentPlanet, planetImage);
            prince = new Prince(s, currentPlanet, godImage);
          });
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

        const yOffset = prince.pos.y - s.height / 2;
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

        currentPlanet.update(currentPlanet, prince, rotationSpeed);
        currentPlanet.show();

        if (nextPlanet) {
          nextPlanet.update(currentPlanet, prince, rotationSpeed);
          nextPlanet.show();
        }

        prince.update();
        prince.show();

        if (!prince.onPlanet && prince.hits(nextPlanet)) {
          prince.land(nextPlanet);
          transitioning = true;
          score++;
          if (score % 3 === 0) showRandomPhrase();
          if (score >= 10) rotationSpeed += 0.02;
          if (score % 3 === 0) { prince.speed += 0.002; }

          setTimeout(() => {
            currentPlanet = nextPlanet;
            nextPlanet = Planet.generateNext(s, currentPlanet, planetImage);
            transitioning = false;
          }, 1500);
        }

        s.pop();

        if (!prince.onPlanet && !perdeu) {
          timeOutsideOrbit += s.deltaTime;
          if (timeOutsideOrbit >= timeLimit) {
            perdeu = true;
            timeOutsideOrbit = 0;
            setTimeout(() => startFadeOut = true, 800);
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
          if (fadeAlpha >= 255) reiniciarJogo();
        }

        // Frase animada com fundo ajustado ao tamanho do texto
        if ((messageVisible || fadeOutMessage) && message.length > 0) {
          s.push();
          s.resetMatrix();
          s.textSize(24);
          s.textAlign(s.CENTER, s.CENTER);
          const padding = 20;
          const textWidthValue = s.textWidth(message);
          const boxWidth = textWidthValue + padding * 2;
          const boxHeight = 50;
          const x = s.width / 2 - boxWidth / 2;
          const y = s.height - boxHeight - 20;

          s.noStroke();
          s.fill(0, 180 * messageAlpha);
          s.rect(x, y, boxWidth, boxHeight, 12);
          s.fill(255, 255 * messageAlpha);
          s.text(message, s.width / 2, y + boxHeight / 2);
          s.pop();

          if (fadeOutMessage) {
            fadeOutText();
          }
        }
      };

      s.mousePressed = () => {
        if (prince?.onPlanet && !transitioning && !perdeu) {
          prince.launch();
        }
      };

      s.windowResized = () => {
        s.resizeCanvas(s.windowWidth, s.windowHeight);
      };

      function reiniciarJogo() {
        score = 0;
        rotationSpeed = 0.01;
        perdeu = false;
        fadeAlpha = 0;
        startFadeOut = false;
        stars = [];
        for (let i = 0; i < numStars; i++) {
          stars.push(createStar());
        }
        currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100, false, planetImage);
        nextPlanet = Planet.generateNext(s, currentPlanet, planetImage);
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
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        message = "";
        messageVisible = true;
        messageAlpha = 1;
        fadeOutMessage = false;
        messageStartTime = s.millis();
        messageDuration = Math.max(phrase.length * 80, 3000);
        const textObj = { textIndex: 0 };

        const interval = setInterval(() => {
          if (textObj.textIndex < phrase.length) {
            message = phrase.substring(0, Math.floor(textObj.textIndex));
            textObj.textIndex += 0.5;
          } else {
            clearInterval(interval);
            setTimeout(() => fadeOutMessage = true, 1200);
          }
        }, 40);
      }

      function fadeOutText() {
        const fadeSpeed = 0.02;
        if (messageAlpha > 0) {
          messageAlpha -= fadeSpeed;
        } else {
          messageVisible = false;
          fadeOutMessage = false;
          messageAlpha = 1;
          message = "";
        }
      }
    }, sketchRef.current);

    return () => p.remove();
  }, []);

  return <div ref={sketchRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default Game;
