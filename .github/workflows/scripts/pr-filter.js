function isDescEmpty(rawMarkdown) {
  const commentRegex = /<!--[\s\S]*?-->/g;
  const markdown = rawMarkdown.replace(commentRegex, '');

  const descriptionRegex = /## Description\s*([\s\S]*?)(##|$)/;
  const match = markdown.match(descriptionRegex);

  if (match) {
    const descriptionContent = match[1].trim();
    return descriptionContent.length === 0;
  }
  return false;
}

function noTypes(body) {
  return (
    body.includes('[ ] Bug fix') &&
    body.includes('[ ] New feature') &&
    body.includes('[ ] Improvement') &&
    body.includes('[ ] Breaking change') &&
    body.includes('[ ] Documentation update')
  );
}

module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;
  const body = pr.body === null ? '' : pr.body.trim();

  if (body === '' || noTypes(body) || isDescEmpty(body)) {
    // Close the PR
    await github.rest.pulls.update({
      ...context.repo,
      pull_number: pr.number,
      state: 'closed'
    });

    // Leave a comment
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: pr.number,
      body: "Oops, looks like you accidentally submitted an empty pull request, don't worry we'll close it for you."
    });

    // Add a label
    await github.rest.issues.addLabels({
      ...context.repo,
      issue_number: pr.number,
      labels: ['spam']
    });
  }
};
