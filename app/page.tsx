/* eslint-disable @next/next/no-img-element */
import Atmosphere from '@/components/Atmosphere';
import Decision from '@/components/Decision';

/* Server component. O HTML inicial já contém marca, posicionamento,
   headline e as duas rotas — nada espera JavaScript.
   Nenhum dado institucional que o cliente não forneceu. */
export default function Page() {
  return (
    <>
      <Atmosphere />
      <main className="stage">
        <header className="top">
          <span className="id">Salt</span>
          <span className="rl" />
          <span className="id">Entry</span>
        </header>

        <div className="body">
          <div>
            <div className="brandwrap">
              <img className="brand" src="/brand/salt-word.webp" alt="Salt"
                   width={620} height={313} fetchPriority="high" />
              <span className="tagline">Technology Company</span>
            </div>

            <h1 className="claim">
              <span className="l"><span>Construímos</span></span>
              <span className="l"><span>o que <em className="lit">vem depois</em>.</span></span>
            </h1>

            <p className="support">
              Estratégia, tecnologia e performance para empresas
              que querem liderar seus mercados.
            </p>
          </div>

          <div className="spacer" aria-hidden="true" />

          <Decision />
        </div>

        <footer className="foot">
          <span>Salt</span>
          <span className="r">Technology Company</span>
        </footer>
      </main>
    </>
  );
}
