node() {
    def denoImage;
    stage('Checkout') {
        checkout scm
    }

    stage("Prepare") {
        denoImage = docker.image("denoland/deno:ubuntu-1.28.2");
        denoImage.inside("-u 0") {
            parallel([
                    test   : {
                        stage("Test") {
                            ansiColor('xterm') {
                               def  stdout = sh(returnStdout: true, script: "deno test --unstable --allow-read --allow-write --allow-env --allow-net --allow-ffi --trace-ops")
                              echo stdout;

                            }
                        }
                    }
            ]);


        }
    }
}