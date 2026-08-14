/* Camada de saída. Isolada do hero para que a transição seja
   um sistema, não um detalhe escondido dentro da composição. */
export default function TransitionLayer({ active }: { active: boolean }) {
  return <div className={`veil${active ? ' on' : ''}`} aria-hidden="true" />;
}
