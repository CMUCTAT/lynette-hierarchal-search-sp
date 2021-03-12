var currentRow = 0, equationSolution, previousLeftTerms, previousRightTerms;

function showNextRow() {
  console.log('showNextRow');
  hideIncorrectDiagrams();
  $(`#solve${++currentRow}Group`).parent().css('display', 'flex');
}

function hideIncorrectDiagrams() {
  $(`#radioExplain${currentRow}Diagram2, #radioExplain${currentRow}Diagram3`).css('display', 'none');
}

var algebraParser = new CTATAlgebraParser(new CTATVariableTable());

function setGivenDiagrams(params) {
  console.log('setGivenDiagrams: ', params);
  var [leftSide, rightSide, solution] = params.split(',');
  equationSolution = parseInt(solution);
  algebraParser.parser.yy.variableTable.setTable({x: equationSolution});
  var leftTerms = getTerms(algebraParser.algParse(leftSide)),
      rightTerms = getTerms(algebraParser.algParse(rightSide));

  var $diagrams = $('#radioExplain0Diagram1, #radioExplain0Diagram3'),
      $diagram2 = $('#radioExplain0Diagram2'),
      $diagram3 = $('#radioExplain0Diagram3');
  if (leftTerms.length > 1 || rightTerms.length > 1) $diagrams = $diagrams.add($diagram2);
  setGivenLine($diagrams.find('.leftBoxes'), leftTerms);
  setGivenLine($diagrams.find('.rightBoxes'), rightTerms);

  if (leftTerms.length > 1 || rightTerms.length > 1) switchExpressions($diagram2, leftTerms, rightTerms);
  shortenLine($diagram3, leftTerms, rightTerms);

  $diagrams.find('.startLine').css('left', '0%');
  $diagrams.find('.endLine').css('left', 'calc(100% - 1px)');

  randomizeDiagramOrder($diagrams);
  $diagrams.css('display', 'inline-flex');
  [previousLeftTerms, previousRightTerms] = [leftTerms, rightTerms];
}

function setGivenLine($line, terms) {
  setGivenBox($line.find('.box1'), terms[0]);
  setGivenBox($line.find('.box2'), terms[1]);
}

function setGivenBox($box, term) {
  if (term == null) $box.css('display', 'none');
  else {
    var value = term.evaluate();
    $box.text(term.toString()).
      css('flex', '' + value + ' ' + value + ' 0').
      css('background-color', hasVariable(term) ? 'rgb(143, 171, 218)': 'rgb(254, 216, 111)');
  }
}

function switchExpressions($diagram, leftTerms, rightTerms) {
  var vars = hasVariable(leftTerms) && hasVariable(rightTerms),
      leftIndex = leftTerms.findIndex((term) => term.constant() != vars),
      rightIndex = rightTerms.findIndex((term) => term.constant() != vars);
  $diagram.find('.leftBoxes').children().eq(leftIndex).text(rightTerms[rightIndex].toString());
  $diagram.find('.rightBoxes').children().eq(rightIndex).text(leftTerms[leftIndex].toString());
}

function shortenLine($diagram, leftTerms, rightTerms) {
  var leftSide = leftTerms.length == 1 && (hasVariable(leftTerms) || rightTerms.length > 1) ||
        leftTerms.length > 1 && rightTerms.length > 1 &&
        getCoefficient(getVariableTerm(leftTerms)) < getCoefficient(getVariableTerm(rightTerms)),
      terms = leftSide ? rightTerms : leftTerms;
  $diagram.find(leftSide ? '.leftBoxes' : '.rightBoxes').css('width', (terms.length == 1 ? '50%' : getLength([terms[0]], terms) + '%'));
}

function setSubtractionDiagrams(params) {
  console.log('setSubtractionDiagrams: ', params);
  var [leftSide, rightSide, subtrahend] = params.split(',');
  algebraParser.parser.yy.variableTable.setTable({x: equationSolution});
  var leftTerms = getTerms(algebraParser.algParse(leftSide)),
      rightTerms = getTerms(algebraParser.algParse(rightSide)),
      subtrahendTerm = algebraParser.algParse(subtrahend),
      left = subtrahendTerm.equals(previousLeftTerms[0]) || subtrahendTerm.equals(previousRightTerms[0]);

  var $diagrams = $(`#radioExplain${currentRow}Diagram1, #radioExplain${currentRow}Diagram2, #radioExplain${currentRow}Diagram3`),
      $diagram2 = $(`#radioExplain${currentRow}Diagram2`),
      $diagram3 = $(`#radioExplain${currentRow}Diagram3`);
  setSubtractionLine($diagrams.find('.leftBoxes'), leftTerms, subtrahendTerm, left);
  setSubtractionLine($diagrams.find('.rightBoxes'), rightTerms, subtrahendTerm, left);

  extendRemoved($diagram2, leftTerms, rightTerms, subtrahendTerm, left);
  removeRemoved($diagram3, leftTerms, rightTerms, subtrahendTerm, left);

  if (left) {
    $diagrams.find('.startLine').css('left', `calc(${100 * (1 - evaluate(leftTerms) / evaluate(leftTerms.concat(subtrahendTerm)))}% - 1px`);
    $diagrams.find('.endLine').css('left', 'calc(100% - 1px)');
    $diagram3.find('.startLine').css('left', '0%');
  } else {
    $diagrams.find('.startLine').css('left', '0%');
    $diagrams.find('.endLine').css('left', `calc(${100 * evaluate(leftTerms) / evaluate(leftTerms.concat(subtrahendTerm))}% - 1px`);
    $diagram3.find('.endLine').css('left', 'calc(100% - 1px)');
  }

  randomizeDiagramOrder($diagrams);
  $diagrams.css('display', 'inline-flex');
  [previousLeftTerms, previousRightTerms] = [leftTerms, rightTerms];
}

function setSubtractionLine($line, terms, subtrahendTerm, left) {
  setSubtractionBox($line.find('.box1'), terms[0], left);
  setSubtractionBox($line.find('.box2'), terms[1], left);
  setSubtractionBox($line.find('.box3'), subtrahendTerm, left, 'dashed');
  setSubtractionBox($line.find('.box4'), subtrahendTerm, left, 'removed', terms);
}

function setSubtractionBox($box, term, left, type = null, terms) {
  if (term == null) $box.css('display', 'none');
  else {
    var value = term.evaluate();
    if (type != 'dashed')
      $box.text(term.toString()).css('flex', '' + value + ' ' + value + ' 0').css('order', 2).
        css('background-color', hasVariable(term) ? 'rgb(143, 171, 218)': 'rgb(254, 216, 111)');
    else
      $box.css('flex', '' + value + ' ' + value + ' 0').css('border', '0.5px dashed').css('background-color', 'white').css('order', left ? 1 : 2).
        css(left ? 'border-right' : 'border-left', 'none');
    if (type == 'removed') {
      var width = getLength([term], terms.concat(term));
      $box.css('width', width + '%').css('position', 'absolute').css('left', left ? (- width + '%') : '100%').
        css('transform-origin', left ? 'right' : 'left').
        css('transform', left ? `rotate(-20deg) translateX(${0.3 * width}%) translateY(-15px)` : `rotate(20deg) translateX(${-0.3 * width}%) translateY(-15px)`);
    }
  }
}

function extendRemoved($diagram, leftTerms, rightTerms, subtrahendTerm, left) {
  var topSide = hasVariable(subtrahendTerm) && hasVariable(leftTerms) || hasConstant(subtrahendTerm) && hasConstant(leftTerms),
      terms = topSide ? leftTerms : rightTerms,
      index = terms.findIndex((term) => term.constant() == subtrahendTerm.constant()),
      text = algebraParser.algSimplify(new CTATAdditionNode('PLUS', [terms[index], subtrahendTerm])).toString(),
      width = getLength([terms[index], subtrahendTerm], terms.concat(subtrahendTerm));
  ($boxes = $diagram.find(topSide ? '.leftBoxes' : '.rightBoxes').find('.box')).eq(index).
    text('').css('border', '0.5px dashed').css(left ? 'border-right' : 'border-left', 'none').css('background-color', 'white');
  $boxes.eq(3).text(text).css('width', width + '%').css('left', left ? (- width + '%') : '100%').
    css('transform', left ? `rotate(-20deg) translateX(${0.3 * width}%) translateY(-15px)` : `rotate(20deg) translateX(${-0.3 * width}%) translateY(-15px)`);
}

function removeRemoved($diagram, leftTerms, rightTerms, subtrahendTerm, left) {
  var topSide = hasVariable(subtrahendTerm) && hasVariable(leftTerms) || hasConstant(subtrahendTerm) && hasConstant(leftTerms),
      terms = topSide ? leftTerms : rightTerms,
      index = terms.findIndex((term) => term.constant() == subtrahendTerm.constant()),
      text = algebraParser.algSimplify(new CTATAdditionNode('PLUS', [terms[index], subtrahendTerm])).toString();
  ($boxes = $diagram.find(topSide ? '.leftBoxes' : '.rightBoxes').find('.box')).eq(2).css('display', 'none');
  $boxes.eq(index).text(text).css('width', getLength([terms[index], subtrahendTerm], terms.concat(subtrahendTerm)) + '%');
  $boxes.eq(3).css('display', 'none');
}

function setDivisionDiagrams(params) {
  console.log('setDivisionDiagrams: ', params);
  var [leftSide, rightSide, divisor] = params.split(',');
  algebraParser.parser.yy.variableTable.setTable({x: equationSolution});
  var leftTerms = getTerms(algebraParser.algParse(leftSide)),
      rightTerms = getTerms(algebraParser.algParse(rightSide));
  divisor = parseInt(divisor);

  var $diagrams = $(`#radioExplain${currentRow}Diagram1, #radioExplain${currentRow}Diagram2`),
      $diagram2 = $(`#radioExplain${currentRow}Diagram2`),
      $diagram3 = $(`#radioExplain${currentRow}Diagram3`);
  setDivisionLine($diagrams.find('.leftBoxes'), leftTerms, divisor);
  setDivisionLine($diagrams.find('.rightBoxes'), rightTerms, divisor);

  extendFreeTerm($diagram2, leftTerms, rightTerms, divisor);

  var baseTerm = leftTerms.length > 1 ? rightTerms[0] : rightTerms.length > 1 ? leftTerms[0] : hasConstant(leftTerms) ? leftTerms[0] : rightTerms[0],
      subtrahendTerm = new CTATMultiplicationNode('TIMES', [new CTATConstantNode(divisor - 1), baseTerm]).simplify(CTATAlgebraParser.full),
      left = hasVariable(leftTerms) == hasVariable(rightTerms);
  setSubtractionLine($diagram3.find('.leftBoxes'), leftTerms, subtrahendTerm, left);
  setSubtractionLine($diagram3.find('.rightBoxes'), rightTerms, subtrahendTerm, left);

  $diagrams.find('.startLine').css('left', '0%');
  $diagrams.find('.endLine').css('left', `calc(${100 / divisor}% - 1px`);
  if (left) {
    $diagram3.find('.startLine').css('left', `calc(${100 * (1 - evaluate(leftTerms) / evaluate(leftTerms.concat(subtrahendTerm)))}% - 1px`);
    $diagram3.find('.endLine').css('left', 'calc(100% - 1px)');
  } else {
    $diagram3.find('.startLine').css('left', '0%');
    $diagram3.find('.endLine').css('left', `calc(${100 * evaluate(leftTerms) / evaluate(leftTerms.concat(subtrahendTerm))}% - 1px`);
  }
  $diagram2.find('.endLine').css('left', 'calc(100% - 1px)');

  $diagrams = $diagrams.add($diagram3);
  randomizeDiagramOrder($diagrams);
  $diagrams.css('display', 'inline-flex');
  [previousLeftTerms, previousRightTerms] = [leftTerms, rightTerms];
}

function setDivisionLine($line, terms, divisor) {
  setDivisionBox($line.find('.box1'), terms[0], divisor);
  setDivisionBox($line.find('.box2'), terms[1], divisor);
  setDivisionBox($line.find('.box3'), null, divisor, terms);
  $line.find('.box4').css('display', 'none');
}

function setDivisionBox($box, term, divisor, terms = null) {
  if (term == null && terms == null) $box.css('display', 'none');
  else if (term) {
    var value = term.evaluate() / divisor;
    $box.text(term.toString()).css('flex', '' + value + ' ' + value + ' 0').
      css('background-color', hasVariable(term) ? 'rgb(143, 171, 218)': 'rgb(254, 216, 111)');
  } else {
    var value = evaluate(terms) * (divisor - 1) / divisor;
    $box.css('flex', '' + value + ' ' + value + ' 0').css('border', '0.5px dashed').css('border-left', 'none').css('background-color', 'white');
    for (var index of range(2, divisor - 1)) $box.append($('<div>', {class: 'hairLine'}).css('left', `calc(${100 * index / divisor}%`));
  }
}

function extendFreeTerm($diagram, leftTerms, rightTerms, divisor) {
  var topSide = leftTerms.length > 1 || rightTerms.length == 1 && hasConstant(leftTerms),
      terms = topSide ? leftTerms : rightTerms,
      index = terms.findIndex((term) => term.constant()),
      value = terms[index].evaluate(),
      rest = terms.length == 1 ? 0 : terms[1 - index].evaluate() * (divisor - 1) / divisor,
      text = algebraParser.algSimplify(new CTATMultiplicationNode('TIMES', [new CTATConstantNode(divisor), terms[index]])).toString();
  ($boxes = $diagram.find(topSide ? '.leftBoxes' : '.rightBoxes').find('.box')).eq(index).css('flex', '' + value + ' ' + value + ' 0').text(text);
  $boxes.eq(2).css('display', terms.length == 1 ? 'none' : 'flex').css('flex', '' + rest + ' ' + rest + ' 0');
}

function getTerms(tree) {
  return tree.addition() ? tree.terms : [tree];
}

function hasVariable(item) {
  return Array.isArray(item) ? item.some((term) => term.countVariables() > 0) : item.countVariables() > 0;
}

function getVariableTerm(list) {
  return list.find((term) => term.countVariables() > 0);
}

function hasConstant(item) {
  return Array.isArray(item) ? item.some((term) => term.constant()) : item.constant();
}

function getCoefficient(term) {
  return term.multiplication() ? term.factors[0].evaluate() : term.constant() ? term.evaluate() : 1;
}

function evaluate(list) {
  return list.reduce(((sum, term) => sum + term.evaluate()), 0);
}

function getLength(terms, list) {
  return (100 * evaluate(terms) / evaluate(list));
}

function randomizeDiagramOrder($diagrams) {
  $diagrams.each((index, diagram) => $(diagram).css('order', (Math.random() * $diagrams.length >> 0) + 1));
}

function* range(start, end) {
  for (let i = start; i <= end; i++) yield i;
}
