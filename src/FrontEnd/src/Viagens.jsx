import React from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import carAnimation from './lotties/car-animation.json';
import origemAnimation from './lotties/origem.json';
import destinoAnimation from './lotties/destino.json';
import horarioAnimation from './lotties/horario.json';
import './viagens.css';

function Viagens() {
  const steps = [
    {
      animation: origemAnimation,
      text: 'Digite o local de origem para calcular a melhor rota.',
    },
    {
      animation: destinoAnimation,
      text: 'Informe seu destino para planejar o trajeto',
    },
    {
      animation: horarioAnimation,
      text: 'Selecione o horário de partida para otimizar o cálculo.',
    },
  ];

  return (
    <>
      {/* Seção hero atualizada */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          {/* Texto à esquerda */}
          <div className="hero-text">
            <h1>
              <strong>Você escolhe.</strong><br />
              A Triap calcula.
            </h1>
            <p>
              Na Triap, acreditamos que a mobilidade precisa ser fácil. Por isso, criamos uma plataforma intuitiva,
              onde você consegue simular e planejar suas viagens em poucos cliques.
              <br />
              Sem complicações, sem enrolação — só o essencial para te levar mais longe.
            </p>
          </div>

          {/* Cartão atrás da animação */}
          <div className="hero-image">
            <div className="hero-card">
              <Lottie animationData={carAnimation} loop className="lottie-hero" />
            </div>
          </div>
        </div>
        <img className="hero-wave" src="./images/hero-wave.svg" alt="Forma ondulada" />
      </section>

      {/* Seção de etapas simples */}
      <section className="steps-section">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center mb-10 font-sf"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Simples, direto e pensado para você.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step-card flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <Lottie animationData={step.animation} loop className="w-24 h-24 mb-4" />
              <p className="text-center font-sf text-base leading-tight">
                {step.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Seção de perfis de usuário */}
      <section className="perfis-section py-16 px-4 bg-white">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center mb-12 font-sf"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Planejar sua corrida como:
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Motorista */}
          <motion.div
            className="perfil-card text-center bg-[#20414F] text-white p-6 rounded-xl shadow-md flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <img src="./images/motorista-icon.svg" alt="Motorista" className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold font-sf mb-2">Motorista</h3>
            <p className="font-sf text-sm text-gray-200">Melhore sua renda analisando os melhores horários.</p>
          </motion.div>

          {/* Passageiro */}
          <motion.div
            className="perfil-card text-center bg-[#20414F] text-white p-6 rounded-xl shadow-md flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <img src="./images/passageiro-icon.svg" alt="Passageiro" className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold font-sf mb-2">Passageiro</h3>
            <p className="font-sf text-sm text-gray-200">Economize mais com estimativas inteligentes.</p>
          </motion.div>

          {/* Empresa */}
          <motion.div
            className="perfil-card text-center bg-[#20414F] text-white p-6 rounded-xl shadow-md flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <img src="./images/empresa-icon.svg" alt="Empresa" className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold font-sf mb-2">Empresa</h3>
            <p className="font-sf text-sm text-gray-200">Reduza custos no transporte corporativo.</p>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default Viagens;
