 { GameManager } from './GameManager';
export class UIManager {
    static UpdateHUD() {
        const hud = UE.UserWidget.GetWidgetFromName('HUD');
        hud.SetText('ScoreText', `分数: ${GameManager.score}`);
    }
    
    static ShowGameOver() {
        UE.WidgetBlueprintLibrary.Create(
            UE.LoadObject<UE.UserWidget>('WidgetBlueprint'/Game/UI/WBP_GameOver.WBP_GameOver'),
            UE.GetPlayerController(0)
        );
    }
}
