function hasTypesChecked(markdown) {
  return /## Type of change/.test(markdown) && /-\s*\[x\]/i.test(markdown);
}

function hasValidDescription(markdown) {
  return (
    /## Description/.test(markdown) &&
    !/## Description\s*\n\s*(##|\s*$)/.test(markdown)
  );
}

module.exports = async ({ github, context }) => {
  const pr = context.payload.pull_request;
  const body = pr.body ? pr.body.trim() : '';
  const markdown = body.replace(/<!--[\s\S]*?-->/g, '');

  const isValid =
    pr.labels.length > 0 || // PR create by dependabot would have labels
    (body && hasTypesChecked(markdown) && hasValidDescription(markdown));

  if (!isValid) {
    await github.rest.pulls.update({
      ...context.repo,
      pull_number: pr.number,
      state: 'closed'
    });

    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: pr.number,
      body: "Oops, it seems you've submitted an invalid pull request. No worries, we'll close it for you."
    });
  }

  return isValid;
};
