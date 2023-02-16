node() {
    def denoImage;
    stage('Checkout') {
        checkout scm
    }

  
    stage("Test") {
        ansiColor('xterm') {
            def  stdout = sh(returnStdout: true, script: "deno test --unstable --allow-read --allow-write --allow-env --allow-net --allow-ffi")
                echo stdout;

            }
    }
}
        