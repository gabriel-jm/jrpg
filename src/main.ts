import './style.css'
import { combat } from './combat'

document.querySelector('#app')?.append(
  combat()
  // characterCard({
  //   name: 'Warrior',
  //   maxHP: 100,
  //   currentHP: 145
  // })
)
