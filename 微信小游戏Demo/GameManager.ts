import * as UE from 'ue';
export enum GameState { Ready, Playing, Paused, GameOver }

export class GameManager {
    static currentState = GameState.Ready;
    static score = 0;
    static enemies: UE.Actor[] = [];
    
    static StartGame() {
        this.currentState = GameState.Playing;
        UE.Log(`游戏状态变更为: ${GameState[this.currentState]}`);
    }
    
    static SpawnEnemy() {
        const enemy = UE.GameplayStatics.BeginDeferredActorSpawnFromClass(
            this.GetWorld(), 
            UE.EnemyCharacter.StaticClass(),
            new UE.Transform()
        ) as UE.EnemyCharacter;
        this.enemies.push(enemy);
        UE.GameplayStatics.FinishSpawningActor(enemy);
    }
}
