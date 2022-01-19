import { GameManager, UnityEngine } from 'csharp'
import { $typeof } from 'puerts';
import { JsBehaviour } from './Base/base'

class JSGameManager extends JsBehaviour<GameManager>{
    public static instance: JSGameManager;

    Start() {
        this.spawnBall();
        JSGameManager.instance = this;
    }

    protected pressed: number;
    protected useTouch: boolean;
    Update() {
        const expectPressTimeMax = 1000;
        if (!this.pressed && (UnityEngine.Input.GetMouseButtonDown(0) || UnityEngine.Input.touchCount != 0)) {
            this.pressed = Date.now();
            if (UnityEngine.Input.touchCount) {
                this.useTouch = true;
            }
        }
        if (
            this.pressed && (
                this.useTouch ? UnityEngine.Input.touchCount == 0 : UnityEngine.Input.GetMouseButtonUp(0)
            )
        ) {
            this.shootBall(Math.min(expectPressTimeMax, Date.now() - this.pressed) / expectPressTimeMax);
            this.pressed = 0;
        }
    }

    shootBall(power: number) {
        const rigidbody = this.currentBall.GetComponent($typeof(UnityEngine.Rigidbody)) as UnityEngine.Rigidbody;
        rigidbody.isKinematic = false;
        rigidbody.velocity = new UnityEngine.Vector3(1 + 2 * power, 3 + 6 * power, 0);
        setTimeout(()=> {
            this.spawnBall();
        }, 500);
    }

    protected currentBall: UnityEngine.GameObject;
    spawnBall() {
        const ball = this.currentBall = UnityEngine.Object.Instantiate(this._mb.BallPrefab) as UnityEngine.GameObject;
        ball.transform.position = this._mb.BallSpawnPoint.transform.position;

        const rigidbody = ball.GetComponent($typeof(UnityEngine.Rigidbody)) as UnityEngine.Rigidbody;
        rigidbody.isKinematic = true;
    }


}

export { JSGameManager }