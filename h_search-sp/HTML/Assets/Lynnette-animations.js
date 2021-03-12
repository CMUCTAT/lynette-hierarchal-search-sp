$(function() {
  HintWrongAcc();
  dynamicHintWindow();
  animateProgress();
  HintAndDone();
});

function HintWrongAcc() { //Hint Wrong Accumulator
  var assocRulesListener = {
    processCommShellEvent: function(evt, msg) {
      // console.log("EVENT", evt, "MSG", msg);
      if (evt === "AssociatedRules" && msg) {
        var indicator = msg.getIndicator();
        var sai = msg.getSAI();
        var selection = (sai ? sai.getSelection() : "_noSuchComponent_");
        //temp fix until Nools sends proper SAI
        if (document.getElementById(selection) === null) {
          return;
        }
        if (document.getElementById(selection).classList.contains("HWAcc")) {
          window.setTimeout(delayAcc, 700, selection, indicator);
          //700 milliseconds for animation to be done
        }
      }
    }
  };
  CTATCommShell.commShell.addGlobalEventListener(assocRulesListener);
}

function delayAcc(selection, indicator) {
  x = document.createElement("SPAN");
  if (indicator === "Hint") {
    x.innerHTML = "?";
    x.classList.add("Cross");
  }
  if (indicator === "InCorrect") {
    x.innerHTML = "&#10005";
    x.classList.add("Cross");
  }
  if (indicator === "Correct") {
    x.innerHTML = "&#10003";
    x.classList.add("Tick");
  }
  document.getElementById(selection + "_HWAcc").appendChild(x);
}

function dynamicHintWindow() {
  var assocRulesListener = {
    processCommShellEvent: function(evt, msg) {
      if (evt === "AssociatedRules" && msg) {
        if (msg.getProperty("TutorAdvice") === "") {
          document.getElementById("HintWindow").style.display = "none";
          // document.getElementById("leftHintButton").style.display = "flex";
          // document.getElementById("rightHintButton").style.display = "flex";
        }
        if (msg.getProperty("TutorAdvice") !== "") {
          var selection = msg.getSAI().getSelection();
          // document.getElementById("leftHintButton").style.display = "none";
          // document.getElementById("rightHintButton").style.display = "none";
          document.getElementById("HintWindow").style.display = "flex";
        }
      }
      if (evt === "InterfaceAction" && msg) {
        //setVisible leads to set display:flex
        if (typeof(msg) !== "object") {
          return;
        }
        else{
          var sai = msg.getSAI();
          var selection = (sai ? sai.getSelection() : "_noSuchComponent_");
          if (sai.getAction() === "SetVisible") {
            document.getElementById(selection).style.display = "flex";

            //contiguous submit step button
            var num = 1;
            if (selection.includes("solve") && selection.includes("Group")) {
              num = parseInt(selection.replace("solve", "").replace("Group", ""));
              currentRow = num;
            }
          }
        }
      }
    }
  };
  CTATCommShell.commShell.addGlobalEventListener(assocRulesListener);
}

function animateProgress() {
  var x = [];
  var interfaceListener = {
    processCommShellEvent: function(evt, msg) {
      if (evt === "ProblemRestoreEnd") { //initial divot
        var skill = msg.getSkillsObject();
        var skills = skill.getSkillSet();
        x = skills;
        initialSkill(x);
      }
      if (evt === "AssociatedRules" && msg) {
        var atLeastOne = false;
        var skill = msg.getSkillsObject();
        var skills = skill.getSkillSet();
        var labels = document.getElementsByClassName("CTATSkillWindow--label");
        for (var i = 0; i < skills.length; i ++) {
          var name = skills[i].getSkillName();
          var level = skills[i].getLevel();
          for (var ii = 0; ii < labels.length; ii ++) {
            if (skillNameEqual(name, labels[ii].innerHTML)) {
              atLeastOne = true;
              var parent = labels[ii].parentNode;
              parent.classList.add("focusProgress");
            }
          }
        }
        initialSkill(x);
        if (atLeastOne) {
          for (var iii = 0; iii < labels.length; iii ++) {
            var parent = labels[iii].parentNode;
            if (!parent.classList.contains("focusProgress")) {
              parent.classList.add("blurProgress");
            }
          }
          window.setTimeout(function() {
            var skillBars = document.getElementsByClassName("CTATSkillWindow--skill");
            for (var iv = 0; iv < skillBars.length; iv ++) {
              skillBars[iv].classList.remove("focusProgress");
              skillBars[iv].classList.remove("blurProgress");
            }
          }, 2000);
        }
      }
    }
  };
  CTATCommShell.commShell.addGlobalEventListener(interfaceListener);
}

function initialSkill(skills) {
  var labels = document.getElementsByClassName("CTATSkillWindow--label");
  for (var i = 0; i < skills.length; i ++) {
    var name = skills[i].getSkillName();
    var level = skills[i].getLevel();
    for (var ii = 0; ii < labels.length; ii ++) {
      if (skillNameEqual(name, labels[ii].innerHTML)) {
        var focus = labels[ii].previousSibling;
        var width = focus.offsetWidth;
        var divot = document.createElement("div");
        divot.classList.add("CTATSkillWindow--initial");
        divot.style.width = level * width + "px";
        focus.firstChild.append(divot);
        labels[ii].innerHTML = labels[ii].innerHTML.replace(/_/g, " "); //removing underline
      }
    }
  }
}

function skillNameEqual(x, y) {
  var a = x.replace("_", " ");
  var b = y.replace("_", " ");
  if (a === b) {
    return true;
  }
  return false;
}

function HintAndDone() {
  var removei = document.getElementById("leftHintButton");
  removei && (removei = removei.firstChild.firstChild);
  removei && document.getElementById("leftHintButton").firstChild.removeChild(removei);
  var removeii = document.getElementById("rightHintButton");
  removeii && (removeii = removeii.firstChild.firstChild);
  removeii && document.getElementById("rightHintButton").firstChild.removeChild(removeii);
  var removeiii = document.getElementById("doneButton").firstChild.firstChild.firstChild;
  document.getElementById("doneButton").firstChild.firstChild.removeChild(removeiii);
  document.getElementById("doneButton").firstChild.firstChild.firstChild.innerHTML = "Finish Problem";
}
