import { html, shell, signal } from 'lithen-fns'

type EnemyTarget = {
  name: string
  level: number
  hp: number
}

export function createSkeleton() {
  return {
    name: 'Skeleton',
    level: 1,
    hp: 20,
    attrs: {
      str: 1,
      dex: 1,
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

const warrior = {
  level: 1,
  name: 'Warrior',
  hp: 20,
  attrs: {
    str: 1,
    dex: 1,
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

  const allies = [warrior]
  const combatList = [
    ...allies,
    createSkeleton(),
    createSkeleton(),
    createSkeleton()
  ]

  combatList.forEach(c => {
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
