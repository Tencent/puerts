import { GameManager } from './GameManager';
export default class PlayerController extends UE.Character {
    private health = 100;
    private weapons: string[] = ['手枪', '步枪', '狙击枪'];
    
    OnHit(damage: number) {
        this.health -= damage;
        if (this.health <= 0) {
            GameManager.currentState = GameState.GameOver;
        }
    }
    
    SwitchWeapon(index: number) {
        UE.Log(`切换武器: ${this.weapons[index]}`);
    }
}
