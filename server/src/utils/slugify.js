// Minimal slugify — no external dependency needed for this.
function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // strip anything not alphanumeric/space/hyphen
    .replace(/[\s_]+/g, '-') // spaces/underscores -> hyphen
    .replace(/-+/g, '-') // collapse repeated hyphens
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphen
}

module.exports = slugify;
