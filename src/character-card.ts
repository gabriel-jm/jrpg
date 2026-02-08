import './character-card.css'
import { html, ref, signal } from 'lithen-fns'

type CharacterCardProps = {
  name: string
  maxHP: number
  currentHP: number
}

export function characterCard(props: CharacterCardProps) {
  const hp = signal(Math.min(props.currentHP, props.maxHP))
  const hpPercentage = hp.data() / 100 * props.maxHP
  const hpBarRef = ref()

  function damage() {
    hp.set(v => Math.max(v - 10, 0))
    updatePercentage()
  }

  function heal() {
    hp.set(v => Math.min(v + 10, props.maxHP))
    updatePercentage()
  }

  function updatePercentage() {
    const hpPercentage = hp.data() / 100 * props.maxHP
    hpBarRef.el.style.setProperty('--value', `${hpPercentage}%`)
  }
  
  return html`
    <div class="character-card">
      <div class="stats">
        <p>${props.name}</p>
        <p>
          <span class="hp-name">HP</span>
          <span>${hp}</span>
        </p>
        <p>
          <span class="hp-name">MP</span>
          <span>30</span>
        </p>
      </div>
      <div>
        <div
          class="hp-bar"
          ref=${hpBarRef}
          style="--value: ${hpPercentage}%"
        ></div>
      </div>
    </div>

    <div>
      <button on-click=${damage}>10 damage</button>
      <button on-click=${heal}>10 heal</button>
    </div>
  `
}
