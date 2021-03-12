var currentRow = 0;

function showNextRow() {
  console.log('showNextRow');
  $(`#solve${++currentRow}Group`).css('display', 'flex');
}

function setGivenDiagrams(params) { showNextRow(); }

function setSubtractionDiagrams(params) { showNextRow(); }

function setDivisionDiagrams(params) { showNextRow(); }
