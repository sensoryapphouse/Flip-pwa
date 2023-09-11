window.onload = () => {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    start();
}

var holdSwitch = 1;
var touch = false;
// Menu
var mainMenu = true;
var mainMenuTouch = false;
var firsttime = true;

function switchDown() {
    if (firsttime) {
        audio = new Audio('sounds/yes.mp3');
        audio.play();
        audio.pause();
        audio1 = new Audio('sounds/no.mp3');
        audio1.play();
        audio1.pause();
        firsttime = false;
    }
    if (holdSwitch)
        touch = true;
    else
        touch = !touch;
}

var mute = false;
var audio;
var audio1;

function PlaySound(s) {
    //    if (audio != undefined)
    //        audio.pause();
    if (mute.checked)
        return;
    try {
        if (s == 'yes.mp3')
            audio.play();
        else
            audio1.play();
        console.log('Sound: ' + s);
    } catch {};
}

function switchUp() {
    if (holdSwitch)
        touch = false;
}

function start() {
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d", {
        alpha: false
    });
    let canvasWidthScaled = window.innerWidth; // canvas.width;
    let canvasHeightScaled = window.innerHeight; //canvas.height;
    let lastFrameTime;
    let actualWidth = -1;
    let actualHeight = -1;

    // Player
    let playerX = 0;
    let playerY = 0;
    let playerVel = 0;
    let playerAngle = 0;
    let gravity = -1400;
    let bounceVelMin = 1000;
    let bounceVel = bounceVelMin;
    let bounceVelHitIncrease = 120;
    let bounceVelMissDecrease = 120;
    let flipAngleVel = 0;
    let uprightFix = false;
    let totalAngleDeltaThisBounce = 0;
    let blinkDelay = 3.0;
    let blinkTime = 0.5;
    let fallOut = false;
    let fallOutTime = 0.0;
    let fallOutLeft = false;
    let totalFlips = 0;
    let flipsThisBounce = 0;
    let flipsLandedThisBounce = 0;
    let flipsBeforePeak = 0;
    let flipsAfterPeak = 0;
    let perfectJump = false;
    let didAFlipStreak = 0;
    let perfectStreak = 0;
    let didLandOnHead = false;
    let maxHeightThisBounce = 0;
    let goalTextColor = "#000";

    // Trampoline
    let trampShakeAmount = 0;
    let trampShakeDecayPct = 0.9;
    let trampShakeAngle = 0;
    let trampShakeAngleSpeed = 4000.0;

    // Camera
    let camScale = 0.7;
    let camDecayDelay = 0;
    let camScaleBounce = 0.0;
    let camScaleBounceDecayPct = 0.8;

    // Input

    // UI
    let popups = [];

    var panel;
    var panelvisible = false;
    var settings;
    var speed = 3;
    var sldspeed;
    var targetMode;
    var s1;
    var s2;

    panel = document.querySelector('panel');
    settings = document.querySelector('settings');
    panel.style.left = "130vw";
    slideTo(panel, 130);
    settings.style.left = "92vw";
    var resetButton = document.createElement('BUTTON');
    resetButton.type = 'BUTTON';
    resetButton.style.position = "absolute";
    resetButton.style.height = "6vh";
    resetButton.style.width = "4vw";
    resetButton.style.left = "20vw";
    resetButton.style.top = "2vh";
    resetButton.style.background = "url('clear.png')";
    resetButton.style.backgroundSize = "4vw 6vh";

    mute = document.createElement("INPUT");
    mute.style.position = "absolute";
    mute.style.height = "3vh";
    mute.style.width = "3vw";
    mute.style.left = "7.5vw";
    mute.style.top = "3vh";
    mute.checked = false;
    mute.setAttribute("type", "checkbox");
    mute.checked = false;

    targetMode = document.createElement("INPUT");
    targetMode.style.position = "absolute";
    targetMode.style.height = "3vh";
    targetMode.style.width = "3vw";
    targetMode.style.left = "12.6vw";
    targetMode.style.top = "3vh";
    targetMode.checked = false;
    targetMode.setAttribute("type", "checkbox");
    targetMode.checked = false;
    sldspeed = document.createElement("INPUT");
    sldspeed.setAttribute("type", "range");
    sldspeed.style.position = "absolute";
    sldspeed.style.height = "2vh";
    sldspeed.style.width = "15vw";
    sldspeed.style.left = "4.2vw";
    sldspeed.style.top = "11.3vh";
    sldspeed.style.color = 'green';
    sldspeed.value = 3;
    sldspeed.min = 1;
    sldspeed.max = 5;
    s1 = document.createElement("INPUT");
    s1.style.position = "absolute";
    s1.style.height = "3vh";
    s1.style.width = "3vw";
    s1.style.left = "6vw";
    s1.style.top = "18vh";
    s2 = document.createElement("INPUT");
    s2.style.position = "absolute";
    s2.style.height = "3vh";
    s2.style.width = "3vw";
    s2.style.left = "12.5vw";
    s2.style.top = "18vh";
    s2.checked = true;
    s1.checked = false;
    s1.setAttribute("type", "radio");
    s2.setAttribute("type", "radio");
    panel.appendChild(mute);
    panel.appendChild(sldspeed);
    panel.appendChild(s1);
    panel.appendChild(s2);
    panel.appendChild(resetButton);
    panel.appendChild(targetMode);

    s1.onclick = function (e) {
        s1.checked = true;
        s2.checked = false;
        holdSwitch = 0;
        touch = false;
        localStorage.setItem("SwitchFlip.holdSwitch", 1);
    }

    s2.onclick = function (e) {
        s2.checked = true;
        s1.checked = false;
        holdSwitch = 1;
        touch = false;
        localStorage.setItem("SwitchFlip.holdSwitch", 0);
    }


    resetButton.onclick = function (e) {
        e.preventDefault();
        resetAll();
    }

    mute.onclick = function (e) {
        localStorage.setItem("SwitchFlip.mute", mute.checked);
    }

    sldspeed.onclick = function (e) {
        localStorage.setItem("SwitchFlip.speed", sldspeed.value);
    }

    targetMode.onclick = function (e) {
        localStorage.setItem("SwitchFlip.targetmode", targetMode.checked);
    }
    loadSettings();

    function resetAll() {
        if (targetMode.checked) {
            localStorage.setItem("SwitchFlip.goalIdx", 0);
            goalIdx = 0;
            Reset();
            mainMenu = true;
            mainMenuTouch = true;
        } else {
            for (i = 0; i < goals.length; i++) {
                goals[i].done = 0;
                localStorage.setItem("SwitchFlip.done" + i.toString(), 0);
            }
        }
        localStorage.setItem("SwitchFlip.maxHeightFt", 0);
        localStorage.setItem("SwitchFlip.maxTotalFlips", 0);
    }



    function slideTo(el, left) {
        var steps = 10;
        var timer = 25;
        var elLeft = parseInt(el.style.left) || 0;
        var diff = left - elLeft;
        var stepSize = diff / steps;

        function step() {
            elLeft += stepSize;
            el.style.left = elLeft + "vw";
            if (--steps) {
                setTimeout(step, timer);
            }
        }
        step();
    }

    function loadSettings() {
        var s = localStorage.getItem("SwitchFlip.mute");
        mute.checked = (s == "true");
        var s = localStorage.getItem("SwitchFlip.targetmode");
        targetMode.checked = (s == "true");
        s = parseInt(localStorage.getItem("SwitchFlip.speed"));
        if (s < 1 || s > 5)
            s = 3;
        sldspeed.value = s;
        s = localStorage.getItem("SwitchFlip.holdSwitch");
        if (s == "1") {
            s1.checked = true;
            s2.checked = false;
            holdSwitch = 0;
        } else {
            s1.checked = false;
            s2.checked = true;
            holdSwitch = 1;
        }

    }

    function saveSettings() {
        localStorage.setItem("SwitchFlip.mute", mute.checked);
        localStorage.setItem("SwitchFlip.speed", speed.value);
        if (s1.checked) {
            localStorage.setItem("SwitchFlip.holdSwitch", 1);
        } else {
            localStorage.setItem("SwitchFlip.holdSwitch", 0);
        }
    }

    function settingsClicked() {
        if (panelvisible) { // save stored values
            slideTo(panel, 130);
            slideTo(settings, 92);
            saveSettings();
        } else {
            slideTo(panel, 75);
            slideTo(settings, 77);
        }
        panelvisible = !panelvisible;
    }

    settings.onmousedown = function (e) { // speed, platform size, player size
        settingsClicked();
    }

    settings.addEventListener("touchstart", e => {
        e.preventDefault();
        settingsClicked();
    }, false);

    // Goals
    let goals = [];
    let goalIdx = parseInt(localStorage.getItem("SwitchFlip.goalIdx")) || 0;
    goals.push({
        text: "🌀",
        func: DidAFlipThisBounce,
        param: 1,
        done: 0
    });
    goals.push({
        text: "🌀🌀", //  ❗⭐🌟🔺🔼↑↻⇑⇧⇪✔✓❌
        func: FlipStreakCheck,
        param: 2,
        done: 0
    });
    goals.push({
        text: "😀😁😀😁😀", // ➀➁➂➃➄➅➆➇➈➉⟳⥁Land perfectly",
        func: LandedPerfectly,
        param: 1,
        done: 0
    });
    goals.push({
        text: "🔼20",
        func: ReachedHeight,
        param: 20,
        done: 0
    });
    goals.push({
        text: "🌀x2",
        func: DidAFlipThisBounce,
        param: 2,
        done: 0
    });
    goals.push({
        text: "🌀🌀🌀",
        func: FlipStreakCheck,
        param: 3,
        done: 0
    });
    goals.push({
        text: "🙃",
        func: LandedOnHead,
        param: 1,
        done: 0
    });
    goals.push({
        text: "🌀x3",
        func: DidAFlipThisBounce,
        param: 3,
        done: 0
    });
    goals.push({
        text: "😀😁😀😁😀x2",
        func: PerfectStreakCheck,
        param: 2,
        done: 0
    });
    goals.push({
        text: "🔼50",
        func: ReachedHeight,
        param: 50,
        done: 0
    });
    goals.push({
        text: "🌀🌀🌀🌀",
        func: FlipStreakCheck,
        param: 4,
        done: 0
    });
    goals.push({
        text: "🌀x4",
        func: DidAFlipThisBounce,
        param: 4,
        done: 0
    });
    goals.push({
        text: "🌀🌀🌀🌀🌀",
        func: FlipStreakCheck,
        param: 5,
        done: 0
    });
    goals.push({
        text: "😀😁😀😁😀x3",
        func: PerfectStreakCheck,
        param: 3,
        done: 0
    });
    goals.push({
        text: "🌀🌀🌀🌀🌀🌀",
        func: FlipStreakCheck,
        param: 6,
        done: 0
    });
    goals.push({
        text: "🔼100",
        func: ReachedHeight,
        param: 100,
        done: 0
    });
    goals.push({
        text: "🌀x5",
        func: DidAFlipThisBounce,
        param: 5,
        done: 0
    });
    goals.push({
        text: "🌀🌀🌀🌀🌀🌀🌀🌀🌀🌀",
        func: FlipStreakCheck,
        param: 10,
        done: 0
    });
    goals.push({
        text: "🔼250",
        func: ReachedHeight,
        param: 250,
        done: 0
    });
    goals.push({
        text: "😀😁😀😁😀x5",
        func: PerfectStreakCheck,
        param: 5,
        done: 0
    });
    goals.push({
        text: "🌀x10",
        func: DidAFlipThisBounce,
        param: 10,
        done: 0
    });
    goals.push({
        text: "🔼500",
        func: ReachedHeight,
        param: 500,
        done: 0
    });
    for (i = 0; i < goals.length; i++)
        goals[i].done = parseInt(localStorage.getItem("SwitchFlip.done" + i.toString())) || 0;
    let goalCompleteTime = 0.0;


    document.onmousedown = function (e) { // speed, platform size, player size
        switchDown();
    }
    document.addEventListener("mouseup", e => {
        switchUp();
    }, false);
    document.addEventListener("touchstart", e => {
        e.preventDefault();
        switchDown();
    }, false);
    document.addEventListener("touchend", e => {
        e.preventDefault();
        switchUp();
    }, false);
    document.addEventListener("touchcancel", e => {
        e.preventDefault();
        switchUp();
    }, false);
    document.addEventListener("keydown", e => {
        if (e.repeat)
            return;
        switch (e.keyCode) {
            case 27: // escape
                resetAll();
                break;
            case 49:
            case 50:
            case 13:
            case 32:
                switchDown();
                break;
        }

    });

    document.addEventListener("keyup", e => {
        switch (e.keyCode) {
            case 49:
            case 50:
            case 13:
            case 32:
                switchUp();
                break;
        }
    });

    s1.addEventListener("touchstart", e => {
        s1.checked = true;
        s2.checked = false;
        holdSwitch = 0;
        touch = false;
        localStorage.setItem("SwitchFlip.holdSwitch", 1);
    });
    s2.addEventListener("touchstart", e => {
        s2.checked = true;
        s1.checked = false;
        holdSwitch = 1;
        touch = false;
        localStorage.setItem("SwitchFlip.holdSwitch", 0);
    });

    resetButton.addEventListener("touchstart", e => {
        e.preventDefault();
        resetAll();
    });

    mute.addEventListener("touchstart", e => {
        e.preventDefault();
        mute.checked = !mute.checked;
        localStorage.setItem("SwitchFlip.mute", mute.checked);
    });

    //    sldspeed.addEventListener("touchstart", e => {
    //        e.preventDefault();
    //        localStorage.setItem("SwitchFlip.speed", sldspeed.value);
    //    });

    targetMode.addEventListener("touchstart", e => {
        e.preventDefault();
        targetMode.checked = !targetMode.checked;
        localStorage.setItem("SwitchFlip.targetmode", targetMode.checked);
    });

    function Reset() {
        playerX = 0;
        playerY = 0;
        bounceVel = bounceVelMin;
        playerVel = bounceVel;
        playerAngle = 0;
        flipAngleVel = 0;
        uprightFix = false;
        totalAngleDeltaThisBounce = 0;
        trampShakeAmount = 0;
        trampShakeAngle = 0;
        camScale = 0.7;
        camDecayDelay = 0;
        fallOut = false;
        totalFlips = 0;
        flipsThisBounce = 0;
        flipsLandedThisBounce = 0;
        goalCompleteTime = 0.0;
        flipsBeforePeak = 0;
        flipsAfterPeak = 0;
        perfectJump = false;
        didAFlipStreak = 0;
        perfectStreak = 0;
        didLandOnHead = false;
        maxHeightThisBounce = 0;
    }

    var speed = 1;

    function GameLoop(curTime) {
        speed = 1 + (5 - sldspeed.value) / 3;
        let dt = Math.min((curTime - (lastFrameTime || curTime)) / 1000.0, 0.2) / speed; // Cap to 200ms (5fps)
        lastFrameTime = curTime;

        UpdateUI(dt);
        UpdatePlayer(dt);
        UpdateCamera(dt);
        UpdateTrampoline(dt);

        // Clear background
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#AADDFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Set camera scale
        ctx.save();
        ctx.scale(camScale + camScaleBounce, camScale + camScaleBounce);
        canvasWidthScaled = canvas.width / (camScale + camScaleBounce);
        canvasHeightScaled = canvas.height / (camScale + camScaleBounce);
        ctx.translate((canvasWidthScaled - canvas.width) * 0.5, (canvasHeightScaled - canvas.height));

        // Draw everything
        DrawTrampoline();
        DrawPlayer();
        DrawUI();
        ctx.restore();
        window.requestAnimationFrame(GameLoop);
    }

    function UpdatePlayer(dt) {
        let playerTouch = touch && !mainMenuTouch;

        // Falling out?
        if (fallOut) {
            let fallOutPct = fallOutTime / 1.0;
            playerX = Math.cos(fallOutPct * Math.PI * 0.5) * 400.0 * (fallOutLeft ? -1.0 : 1.0) * bounceVel * 0.001;
            playerY = Math.sin(fallOutPct * Math.PI) * 200.0 * bounceVel * 0.001;
            playerAngle += 800.0 * dt * (fallOutLeft ? -1.0 : 1.0);

            fallOutTime -= dt;
            if (fallOutTime <= 0.0) {
                Reset();
            }
            return;
        }

        // Flipping?
        if (playerTouch && playerY > 100) {
            uprightFix = false;
            flipAngleVel += (720.0 - flipAngleVel) * 0.1;
        }
        // Not flipping
        else {
            if (uprightFix) {
                playerAngle *= 0.8;
                if (Math.abs(playerAngle) < 0.01) {
                    uprightFix = false;
                }
            }

            flipAngleVel *= 0.7;
        }

        // Calculate flips
        let prevPlayerAngle = playerAngle;
        playerAngle += flipAngleVel * dt;
        totalAngleDeltaThisBounce += playerAngle - prevPlayerAngle;
        let prevFlipsThisBounce = flipsThisBounce;
        flipsThisBounce = Math.floor((totalAngleDeltaThisBounce + 90.0) / 360.0);
        if (flipsThisBounce > prevFlipsThisBounce) {
            AddPopup(canvas.width * 0.5 + 100, canvas.height - 200, `x${flipsThisBounce}`, "#D37CFF");
            if (playerVel > 0.0) {
                flipsBeforePeak++;
            }
        }

        // Clamp angle to -180 -> 180
        if (playerAngle >= 180.0) {
            playerAngle -= 360.0;
        } else if (playerAngle < -180.0) {
            playerAngle += 360;
        }

        // Move player
        playerVel += gravity * dt;
        playerY += playerVel * dt;
        maxHeightThisBounce = Math.max(playerY, maxHeightThisBounce);

        // Hit trampoline?
        if (playerY <= 0.0) {
            // Start trampoline shake
            trampShakeAmount = 16.0;
            trampShakeAngle = 0;

            // Fall out?
            if (Math.abs(playerAngle) > 30.0) {
                fallOut = true;
                fallOutTime = 1.0;
                fallOutLeft = Math.random() < 0.5;

                AddPopup(canvas.width * 0.5 + 100, canvas.height - 100, "❌❌❌❌", "#F42");
                PlaySound("no.mp3");
                flipsLandedThisBounce = 0;
                perfectJump = false;
                didAFlip = false;
                didAFlipStreak = 0;
                perfectStreak = 0;

                if (Math.abs(playerAngle) > 145.0) {
                    didLandOnHead = true;
                    CheckGoals();
                }
            } else {
                // Set bounce velocity
                let didAFlip = totalAngleDeltaThisBounce >= 270;
                perfectJump = Math.abs(playerAngle) < 6.5;
                if (didAFlip) {
                    let flipMult = 1.0 + (flipsThisBounce / 5) * 0.5;
                    let bounceVelIncrease = perfectJump ? (bounceVelHitIncrease * 1.5) : bounceVelHitIncrease;
                    bounceVel += bounceVelIncrease * flipMult;
                } else {
                    bounceVel = Math.max(bounceVel - bounceVelMissDecrease, bounceVelMin);
                }

                if (didAFlip && perfectJump && !mainMenu) {
                    camScaleBounce = 0.025;
                }

                if (didAFlip) {
                    flipsLandedThisBounce = flipsThisBounce;
                    totalFlips += flipsThisBounce;
                    didAFlipStreak++;
                    if (perfectJump) {
                        perfectStreak++;
                    }

                    if (perfectJump) {
                        AddPopup(canvas.width * 0.5 + 100, canvas.height - 100, "😀😁😀😁😀!", "#FF0");
                    } else {
                        AddPopup(canvas.width * 0.5 + 100, canvas.height - 100, "😀😁😀", "#0F4");
                    }
                } else {
                    didAFlipStreak = 0;
                    perfectStreak = 0;
                }

                CheckGoals();
            }

            // Reset for new bounce
            playerY = 0.0;
            playerVel = bounceVel;
            uprightFix = true;
            totalAngleDeltaThisBounce = 0;
            flipsLandedThisBounce = 0;
            flipsThisBounce = 0;
            flipsBeforePeak = 0;
            flipsAfterPeak = 0;
            didLandOnHead = false;
            maxHeightThisBounce = 0;
        }

        // Update blink
        blinkDelay -= dt;
        blinkTime -= dt;
        if (blinkDelay <= 0.0) {
            blinkDelay = 1.0 + (Math.random() * 3.0);
            blinkTime = 0.1 + (Math.random() * 0.1);
        }
    }

    function UpdateCamera(dt) {
        // Calculate desired scale
        let desiredCamScale = (280.0 / Math.max(playerY, 280.0)) * 1.5;
        if (desiredCamScale < camScale) {
            camDecayDelay = 3.0;
        } else {
            camDecayDelay -= dt;
        }
        desiredCamScale = Math.min(camScale, desiredCamScale);
        if (desiredCamScale < 0.5) {
            desiredCamScale = Math.pow(desiredCamScale, 0.97);
        }

        // Lerp to it
        camScale += (desiredCamScale - camScale) * 0.2;

        // Lerp out after hold delay is over
        if (camDecayDelay <= 0.0) {
            camScale += (0.7 - camScale) * 0.001;
        }

        camScaleBounce *= camScaleBounceDecayPct;
    }

    function UpdateTrampoline(dt) {
        // Update shake
        trampShakeAmount *= trampShakeDecayPct;
        trampShakeAngle += trampShakeAngleSpeed * dt;
    }

    function UpdateUI(dt) {
        // Main menu touch logic
        if (touch) {
            if (!mainMenuTouch) {
                if (mainMenu) {
                    mainMenuTouch = true;
                    touch = false;
                }
                mainMenu = false;
            }

        } else {
            mainMenuTouch = false;
        }

        // Update popups
        popups.forEach((popup, index, object) => {
            popup.time += dt;
            if (popup.time >= .5 * (speed / 2)) { // PB was 0.5
                object.splice(index, 1);
            }
        });

        // Update goal transition logic
        if (goalCompleteTime > 0.0) {
            goalCompleteTime -= dt;
            if (goalCompleteTime <= 0.0) {
                goalIdx++;
                localStorage.setItem("SwitchFlip.goalIdx", goalIdx);
            }
        }
    }

    function DrawLine(x1, y1, x2, y2, color, width) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    function DrawRectangle(width, height, color) {
        let halfWidth = width * 0.5;
        let halfHeight = height * 0.5;

        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-halfWidth, -halfHeight);
        ctx.lineTo(halfWidth, -halfHeight);
        ctx.lineTo(halfWidth, halfHeight);
        ctx.lineTo(-halfWidth, halfHeight);
        ctx.lineTo(-halfWidth, -halfHeight);
        ctx.fill();
        ctx.restore();
    }

    function DrawText(text, x, y, angle, size, align, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.font = `bold ${size}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = align.toLowerCase();
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    function DrawTrampoline() {
        ctx.save();
        ctx.translate(canvas.width * 0.5, canvas.height - 120);

        DrawRectangle(canvasWidthScaled, 240, "#00D846"); // Grass
        DrawLine(-196, -20, -196, 80, "#000", 12); // Left pole
        DrawLine(196, -20, 196, 80, "#000", 12); // Right pole
        ctx.translate(0, Math.sin(trampShakeAngle * Math.PI / 180.0) * trampShakeAmount);
        DrawLine(-200, 0, 200, 0, "#000", 12); // Mesh

        ctx.restore();
    }

    function DrawPlayer() {
        ctx.save();
        ctx.translate(canvas.width * 0.5 + playerX, (canvas.height - 170) - playerY);
        ctx.rotate(playerAngle * Math.PI / 180.0);

        ctx.translate(0, -40);
        DrawRectangle(80, 96, "#FF9600"); // Head
        ctx.save();
        if (blinkTime > 0.0 || fallOut) {
            ctx.translate(-4, 4);
            DrawRectangle(40, 40, "#000"); // Eye
            ctx.translate(4, 4);
            DrawRectangle(34, 34, "#FF9600"); // Eye
            ctx.translate(-12, 0);
        } else {
            ctx.translate(-4, 4);
            DrawRectangle(40, 40, "#FFF"); // Eye
            let pupilOffset = Math.max(Math.min((playerVel / 1000), 1.0), 0.0) * 7.0;
            ctx.translate(-8, 4 - pupilOffset);
            DrawRectangle(16, 24, "#000"); // Pupil
        }
        ctx.restore();

        ctx.translate(-4, 4);
        if (!touch || mainMenuTouch) {
            ctx.translate(8, 40);
            DrawLine(0, 0, 0, 60, "#000", 8); // Leg
        } else {
            ctx.translate(8, 40);
            DrawLine(0, 0, -30, 20, "#000", 8); // Leg (upper)
            DrawLine(-30, 20, 0, 40, "#000", 8); // Leg (lower)
        }

        ctx.restore();
    }

    function DrawUI() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (mainMenu) { // PB title text here
            let titleTxt = "Switch Flip!";
            DrawText(titleTxt, canvas.width * 0.5, 180, 5 * Math.PI / 180.0, 120, "center", "#000");
            DrawText(titleTxt, (canvas.width * 0.5) - 10, 175, 5 * Math.PI / 180.0, 120, "center", "#FF9600");

            //        let subtitleTxt = "a game about backflips";
            //        DrawText(subtitleTxt, (canvas.width * 0.5), 240, -5 * Math.PI / 180.0, 50, "center", "#000");
            //        DrawText(subtitleTxt, (canvas.width * 0.5) - 4, 235, -5 * Math.PI / 180.0, 50, "center", "#FFF");
            //
            //        let instructionsTxt = "land flips to gain height - complete goals to feel good";
            //        DrawText(instructionsTxt, (canvas.width * 0.5), canvas.height - 20, 0.0, 25, "center", "#000");
            //        DrawText(instructionsTxt, (canvas.width * 0.5) - 3, canvas.height - 23, 0.0, 25, "center", "#FFF");
        } else {
            let heightFt = Math.floor(playerY / 40.0);
            let maxHeightFt = localStorage.getItem("SwitchFlip.maxHeightFt");
            if (maxHeightFt === null || heightFt > maxHeightFt) {
                localStorage.setItem("SwitchFlip.maxHeightFt", heightFt);
                maxHeightFt = heightFt;
            }

            let heightTxt = `🔼: ${heightFt} ft (🔼: ${maxHeightFt} ft)`;
            DrawText(heightTxt, 12, 27, 0.0, 20, "left", "#000"); // 12, 27
            //DrawText(heightTxt, 18, 28, 0.0, 25, "left", "#AAF");

            let maxTotalFlips = localStorage.getItem("SwitchFlip.maxTotalFlips");
            if (maxTotalFlips === null || totalFlips > maxTotalFlips) {
                localStorage.setItem("SwitchFlip.maxTotalFlips", totalFlips);
                maxTotalFlips = totalFlips;
            }

            let flipsTxt = `🌀: ${totalFlips} (🌀: ${maxTotalFlips})`;
            DrawText(flipsTxt, 12, 50, 0.0, 20, "left", "#000");
            //DrawText(flipsTxt, 18, 60, 0.0, 25, "left", "#FFF");

            if (goalCompleteTime > 0.0) {
                goalTextColor = (goalCompleteTime % 0.15 < 0.075) ? "#000" : "#00FF00";
            }

            if (goalIdx < goals.length && targetMode.checked) {
                DrawText(`🎯 #${goalIdx + 1}:`, canvas.width - 75, 27, 0.0, 20, "right", goalTextColor); // PB 27
                DrawText(goals[goalIdx].text, canvas.width - 75, 50, 0.0, 20, "right", goalTextColor); // PB 50
            } else {
                //            goalTextColor = (Date.now() % 800 < 400) ? "#000" : "#FF9600";
                //
                //            DrawText(`Congratulations! You've completed all goals!`, canvas.width - 12, 27, 0.0, 20, "right", goalTextColor);
                //            DrawText("Press here to reset and play again!", canvas.width - 12, 50, 0.0, 20, "right", goalTextColor);
            }

            if (!targetMode.checked) {
                var half = Math.floor(goals.length / 2);
                for (i = 0; i < goals.length; i++) {
                    var s = "";
                    switch (goals[i].done) {
                        case 1:
                            s = "✅";
                            break;
                        case 2:
                            s = "✅✅";
                            break;
                        case 3:
                            s = "✅✅✅";
                            break;
                        default:
                            s = " ";
                    }
                    if (i < half) {
                        //function DrawText(text, x, y, angle, size, align, color) {
                        DrawText(goals[i].text, 60, 140 + ((i + 1) * 25), 0.0, 12, "left", goalTextColor);
                        DrawText(s, 12, 140 + ((i + 1) * 25), 0.0, 12, "left", goalTextColor);
                    } else {
                        DrawText(goals[i].text, canvas.width - 60, 140 + (i - half + 1) * 25, 0.0, 12, "right", goalTextColor); // PB 50
                        DrawText(s, canvas.width - 12, 140 + (i - half + 1) * 25, 0.0, 12, "right", goalTextColor); // 
                    }
                }
            }
        }

        // Draw popups
        popups.forEach(popup => {
            let popupPct = Math.min(popup.time / 0.1, 1.0);
            let offsetAnglePct = Math.min(popup.time / 0.4, 1.0);
            let xOffset = Math.sin(offsetAnglePct * Math.PI * 0.5) * 25.0;
            let yOffset = Math.sin(offsetAnglePct * Math.PI * 0.5) * 50.0;
            let startSize = popup.smallSize ? 20 : 30;
            let sizeMult = popup.smallSize ? 10 : 25;
            DrawText(popup.text, (popup.x + xOffset) - 3, (popup.y - yOffset) - 3, -5 * Math.PI / 180.0, startSize + Math.sin(popupPct * Math.PI * 0.75) * sizeMult, "center", popup.color);
        });
        ctx.restore();
    }

    function AddPopup(x, y, text, color, smallSize) {
        popups.push({
            x: x,
            y: y,
            text: text,
            color: color,
            time: 0.0,
            smallSize: smallSize || false
        });
    }

    function FitToScreen() {
        let aspectRatio = canvas.width / canvas.height;
        let newWidth = window.innerWidth;
        let newHeight = window.innerWidth / aspectRatio;

        if (newHeight > window.innerHeight) {
            newHeight = window.innerHeight;
            newWidth = newHeight * aspectRatio;
        }

        if (newWidth !== actualWidth || newHeight !== actualHeight) {
            canvas.style.width = newWidth + "px";
            canvas.style.height = newHeight + "px";

            actualWidth = newWidth;
            actualHeight = newHeight;
        }

        window.scrollTo(0, 0);
    }


    function CheckGoals() { // PB check all goals here
        if (targetMode.checked) {
            if (goalIdx < goals.length && goals[goalIdx].func(goals[goalIdx])) {
                AddPopup(canvas.width - 100, 120, "✅✅✅✅✅", "#FF0", true);
                goalCompleteTime = 1.0;
                didAFlipStreak = 0;
                perfectStreak = 0;
                PlaySound("yes.mp3");
            }
        } else {
            for (i = goals.length - 1; i >= 0; i--) {
                if (goals[i].func(goals[i])) {
                    if (goals[i].done < 3) {
                        goals[i].done++;
                        AddPopup(200, canvas.height / 2 - 30, goals[i].text, "#FF0", true);
                        AddPopup(200, canvas.height / 2, "✅✅✅✅✅", "#FF0", true);
                        localStorage.setItem("SwitchFlip.done" + i.toString(), goals[i].done);
                        PlaySound("yes.mp3");
                        return;
                    }
                }
            }
        }
    }

    function DidAFlipThisBounce(goal) {
        if (flipsLandedThisBounce >= goal.param) {
            return true;
        }
        return false;
    }

    function LandedPerfectly(goal) {
        return perfectJump && flipsLandedThisBounce > 0;
    }

    function FlipStreakCheck(goal) {
        return didAFlipStreak >= goal.param;
    }

    function PerfectStreakCheck(goal) {
        return perfectStreak >= goal.param;
    }

    function LandedOnHead(goal) {
        return didLandOnHead;
    }

    function ReachedHeight(goal) {
        return Math.floor(maxHeightThisBounce / 40.) >= goal.param;
    }

    Reset();
    window.requestAnimationFrame(GameLoop);

    function showPressedButton(index) {
        console.log("Press: ", index);
        if (mainMenu) {
            mainMenu = false;
        } else {
            switchDown();
        }
    }

    function removePressedButton(index) {
        console.log("Releasd: ", index);
        switchUp();
    }
    gamepads.addEventListener('connect', e => {
        console.log('Gamepad connected:');
        console.log(e.gamepad);
        gpad = e.gamepad;
        e.gamepad.addEventListener('buttonpress', e => showPressedButton(e.index));
        e.gamepad.addEventListener('buttonrelease', e => removePressedButton(e.index));
    });

    gamepads.addEventListener('disconnect', e => {
        console.log('Gamepad disconnected:');
        console.log(e.gamepad);
    });

    gamepads.start();
}
