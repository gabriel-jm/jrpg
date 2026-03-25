import { html, shell, signal } from 'lithen-fns'

type EnemyTarget = {
  name: string
  level: number
  hp: number
}

type CharacterAttrs = {
  str: number
  con: number
  mag: number
  agl: number
}

type CharacterSkillFn = (char: Character) => number 

type Character = {
  id: string
  name: string
  level: number
  hp: number
  attrs: CharacterAttrs
  speed: number
  skills: string[]
  equip?: {
    weapon?: {
      attrs?: { str?: number }
    },
    armor?: {},
    accessories: [{},{}]
  }
}

export function createSkeleton() {
  return {
    id: 'skeleton',
    name: 'Skeleton',
    level: 1,
    hp: 20,
    attrs: {
      str: 1,
      con: 1,
      mag: 1,
      agl: 1
    },
    speed: 0,
    skills: {
      slash: {
        power: 1
      }
    },
    pickTarget(targets: EnemyTarget[]) {
      if (targets.length === 1) {
        return targets[0]
      }

      let target = null

      for (const t of targets) {
        if (!target) {
          target = t
          continue
        }

        if (t.hp < target.hp) {
          target = t
          continue
        }
      }
    },
    act(targets: EnemyTarget[]): [EnemyTarget|undefined, string] {
      const target = this.pickTarget(targets)

      return [target, 'slash']
    }
  }
}

const skills: Record<string, CharacterSkillFn> = {
  slash(char: Character) {
    const skillPower = 0.8
    const weaponBonus = char.equip?.weapon?.attrs?.str ?? 0
    const attackPower = char.attrs.str + weaponBonus

    return attackPower * skillPower
  }
}

const warrior = {
  level: 1,
  id: 'player',
  name: 'Warrior',
  hp: 20,
  attrs: {
    str: 1,
    con: 1,
    mag: 1,
    agl: 3
  },
  speed: 0,
  skills: {
    slash: {
      power: 1
    }
  },
  equip: {
    weapon: {
      id: 'short_sword',
      name: 'Short Sword',
      attrs: { str: 1 }
    }
  }
}

export function combat() {
  let currentTurn = signal(0)
  const isPlayerTurn = signal(false)
  const combatLog = signal<string[]>([])
  const enemiesNames = new Map<string, number>()

  const allies = [warrior]
  const combatList = [
    ...allies,
    createSkeleton(),
    createSkeleton(),
    createSkeleton()
  ]

  combatList.forEach(c => {
    const eName = enemiesNames.get(c.id)

    if (!eName) {
      enemiesNames.set(c.id, 1)
    } else {
      enemiesNames.set(c.id, eName + 1)
      c.name += ` ${String.fromCharCode(64 + eName + 1)}`
    }

    c.speed = c.attrs.agl + Math.round(Math.random() * 10)
  })

  combatList.sort((a, b) => {
    return a.speed > b.speed
      ? -1
      : 1
  })

  function nextTurn() {
    currentTurn.set(v => v + 1)

    if (currentTurn.data() == combatList.length) {
      currentTurn.set(0)
    }

    runTurn()
  }

  function runTurn() {
    const current = combatList[currentTurn.data()]

    if ('act' in current) {
      isPlayerTurn.set(false)
      const [] = current.act(allies)

      setTimeout(() => {
        combatLog.data().push(`${current.name} act`)
        combatLog.update()
        nextTurn()
      }, 500)
    } else {
      isPlayerTurn.set(true)
    }
  }

  function playerAction(action?: () => void) {
    return () => {
      action?.()
      isPlayerTurn.set(false)
      nextTurn()
    }
  }

  function playerAttack() {
    combatLog.set(v => [...v, 'Warrior attacked'])
  }

  function playerDefense() {
    combatLog.set(v => [...v, 'Warrior is defending'])
  }

  queueMicrotask(() => runTurn())

  return html`
    <h1>Combat</h1>
    <ul>
      ${shell(() => {
        return combatList.map((c, i) => {
          const isCurrent = i === currentTurn.get() ? '>>> ' : ''
          return html`
            <p>${isCurrent} ${c.name} (speed: ${c.speed})</p>
          `
        })
      })}

      ${shell(() => {
        if (isPlayerTurn.get()) {
          return html`
            <button on-click=${playerAction(playerAttack)}>
              Attack
            </button>
            <button on-click=${playerAction(playerDefense)}>
              Next
            </button>
          `
        }
      })}
    </ul>

    <h3>Battle log</h3>
    <ul>
      ${shell(() => {
        return combatLog.get().map(l => {
          return html`
            <p>${l}</p>
          `
        })
      })}
    </ul>

    <button on-click=${nextTurn}>next turn</button>
  `
}
