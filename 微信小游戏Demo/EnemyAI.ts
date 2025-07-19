 * as UE from 'ue';
export class EnemyAI extends UE.AIController {
    private patrolPoints: UE.Vector[] = [];
    private currentPatrolIndex = 0;
    
    ReceivePossess(pawn: UE.Pawn) {
        this.RunBehaviorTree(UE.LoadObject<UE.BehaviorTree>('BehaviorTree'/Game/AI/BT_Enemy.BT_Enemy'));
    }
    
    GetNextPatrolPoint(): UE.Vector {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        return this.patrolPoints[this.currentPatrolIndex];
    }
}
