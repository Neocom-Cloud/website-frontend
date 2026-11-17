// Maps directory URLs onto their index document.
//
// With an S3 *website* endpoint S3 does this itself, but that endpoint only
// speaks HTTP, so it cannot sit behind Origin Access Control. Against the
// REST endpoint CloudFront asks S3 for the key literally: `default_root_object`
// covers `/` and nothing else, so `/pt-br/` would fetch a key that does not
// exist. Every localized route on this site is a directory, so without this
// the whole site 404s apart from the root.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.charAt(uri.length - 1) === "/") {
    request.uri = uri + "index.html";
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);

  if (lastSegment.indexOf(".") === -1) {
    // An extensionless path is a directory typed without its trailing slash.
    // Rewriting beats redirecting here: it keeps the query string (the root
    // route reads `?lang=`) and the pages already carry rel="canonical", so
    // the duplicate URL costs nothing in search.
    request.uri = uri + "/index.html";
  }

  return request;
}
