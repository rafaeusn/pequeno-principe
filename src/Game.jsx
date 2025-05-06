import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";
import Prince from './Prince';
import Planet from './Planet';

const Game = () => {
  const sketchRef = useRef();
  const [audio] = useState(new Audio('/assets/music.mp3')); // Carregar o áudio

  useEffect(() => {
    const handleUserInteraction = () => {
      audio.play().catch((error) => {
        console.error("Erro ao tentar tocar o áudio: ", error);
      });
      window.removeEventListener("click", handleUserInteraction);
    };
  
    window.addEventListener("click", handleUserInteraction);
  
    return () => {
      window.removeEventListener("click", handleUserInteraction);
    };
  }, [audio]);

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
    let awardImage;
    let energyImage;
    let stars = [];  // Array de estrelas

    const p = new p5((s) => {
      let currentPlanet, nextPlanet, prince;
      let transitioning = false;
      let score = 0;
      let rotationSpeed = 0.01;
      let timeOutsideOrbit = 0;
      const timeLimit = 2333;
      let perdeu = false;
      let fadeAlpha = 0;
      let startFadeOut = false;
      let camZoom = 1;
      let targetZoom = 1;

      // Frase animada
      let fullMessage = "";
      let message = "";
      let messageVisible = false;
      let messageAlpha = 1;
      let fadeOutMessage = false;
      let charIndex = 0;  

      s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight);  // Garantir que o canvas ocupe toda a tela
        
        // Gerar as estrelas no fundo
        for (let i = 0; i < 1000; i++) {
          stars.push(new Star(s.random(s.width), s.random(s.height), s.random(255), s.random(0.1, 3), s.random(1)));
        }
      };

      // Função para carregar todas as imagens
      const loadImages = () => {
        return new Promise((resolve, reject) => {
          s.loadImage("/assets/award.png", (awardImg) => {
            awardImage = awardImg;
            s.loadImage("/assets/planeta.png", (planetImg) => {
              planetImage = planetImg;
              s.loadImage("/assets/coroa.png", (godImg) => {
                godImage = godImg;
                s.loadImage("/assets/energy.png", (energyImg) => {
                  energyImage = energyImg;
                  resolve();
                });
              });
            });
          });
        });
      };

      loadImages().then(() => {
        currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100, false, planetImage);
        nextPlanet = Planet.generateNext(s, currentPlanet, planetImage);
        prince = new Prince(s, currentPlanet, godImage);
      }).catch((error) => {
        console.error("Erro ao carregar as imagens:", error);
      });

      s.draw = () => {
        if (!godImage || !prince || !currentPlanet || !nextPlanet) return;

        // Desenhar o fundo com as estrelas
        s.background(0);

        // Atualizar e exibir as estrelas
        for (let i = 0; i < stars.length; i++) {
          stars[i].twinkle();
          stars[i].showStar(s);
        }

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
          if (score % 3 === 0) { prince.speed += 0.01; }

          setTimeout(() => {
            // Reciclagem de planetas: reaproveitando o planeta atual
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
        s.textAlign(s.LEFT, s.TOP); // Alinhamento à esquerda do ponto (x, y)
        s.image(awardImage, s.width / 10 - 100, 60, 40, 40);  // Ajuste o tamanho (40x40) conforme necessário
        s.text(`${score}`, s.width / 10 - 50, 67);

        s.fill(255);
        s.textSize(32);
        s.textAlign(s.LEFT, s.TOP); // Alinhamento à esquerda do ponto (x, y)
        s.image(energyImage, s.width / 10 - 100, 110, 40, 40);  // Ajuste o tamanho (40x40) conforme necessário
        s.text(`${Math.round(prince.speed * 100)}`, s.width / 10 - 50, 120);

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

        // Animação da frase
        if ((messageVisible || fadeOutMessage) && fullMessage.length > 0) {
          s.push();
          s.resetMatrix();
          s.textSize(24);
          s.textAlign(s.CENTER, s.CENTER);

          // Atualizar a digitação
          if (!fadeOutMessage && charIndex < fullMessage.length) {
            charIndex += 0.5;
            message = fullMessage.substring(0, Math.floor(charIndex));
            if (charIndex >= fullMessage.length) {
              setTimeout(() => fadeOutMessage = true, 1200);
            }
          }

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

          if (fadeOutMessage) fadeOutText();
        }
      };

      s.mousePressed = () => {
        if (prince?.onPlanet && !transitioning && !perdeu) {
          prince.launch();
        }
      };

      s.windowResized = () => {
        s.resizeCanvas(s.windowWidth, s.windowHeight);  // Ajuste para redimensionar o canvas corretamente
      };

      function reiniciarJogo() {
        score = 0;
        perdeu = false;
        fadeAlpha = 0;
        startFadeOut = false;
        currentPlanet = new Planet(s, s.width / 2, s.height / 2, 100, false, planetImage);
        nextPlanet = Planet.generateNext(s, currentPlanet, planetImage);
        prince = new Prince(s, currentPlanet, godImage);
      }

      // Função para mostrar a frase
      function showRandomPhrase() {
        fullMessage = phrases[Math.floor(Math.random() * phrases.length)];
        message = "";
        charIndex = 0;
        messageVisible = true;
        messageAlpha = 1;
        fadeOutMessage = false;
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
          fullMessage = "";
        }
      }

      // Classe Star
      class Star {
        constructor(tx, ty, tc, tf, td) {
          this.x = tx;
          this.y = ty;
          this.c = tc;
          this.f = tf;
          this.down = td;
        }

        showStar(s) {
          s.stroke(this.c);
          s.point(this.x, this.y);
        }

        twinkle() {
          if (this.c >= 255) {
            this.down = true;
          }
          if (this.c <= 0) {
            this.down = false;
          }

          if (this.down) {
            this.c -= this.f;
          } else {
            this.c += this.f;
          }
        }
      }
    }, sketchRef.current);

    return () => p.remove();
  }, [audio]);

  return <div ref={sketchRef} style={{ display: "flex", justifyContent: "center" }} />;
};

export default Game;
