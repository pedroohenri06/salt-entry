/* eslint-disable @next/next/no-img-element */
import Atmosphere from '@/components/Atmosphere';
import Decision from '@/components/Decision';

/* Server component. O HTML inicial já contém marca, headline e
   as duas ações — nada espera JavaScript para existir. */
export default function Page() {
  return (
    <>
      <Atmosphere />
      <main className="stage">
        <header className="sys">
          <span>Salt</span>
          <span className="rule" />
          <span>Entry</span>
        </header>

        <div className="body">
          <div>
            <img className="brand" src="/brand/salt-word.webp" alt="Salt"
                 width={520} height={266} fetchPriority="high" />
            <h1 className="claim">
              <span className="ln"><span>Construímos</span></span>
              <span className="ln"><span>o que <b>vem depois</b>.</span></span>
            </h1>
            <p className="support">
              Estratégia, tecnologia e performance para operações
              que não vieram disputar o segundo lugar.
            </p>
          </div>
          <Decision />
        </div>

        <footer className="foot">
          <span>Porto Alegre</span>
          <span className="r">Est. 2024</span>
        </footer>
      </main>
    </>
  );
}
