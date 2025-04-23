name: Sync to CNB
on: [push]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Sync to CNB Repository
        run: |
          docker run --rm \
            -v ${{ github.workspace }}:${{ github.workspace }} \
            -w ${{ github.workspace }} \
            -e PLUGIN_TARGET_URL="https://cnb.cool/tencent/puerts/puerts.git" \
            -e PLUGIN_AUTH_TYPE="https" \
            -e PLUGIN_USERNAME="cnb" \
            -e PLUGIN_PASSWORD=${{ secrets.CNB_TOKEN }} \
            -e PLUGIN_FORCE="true" \
            tencentcom/git-sync
