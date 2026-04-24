# Formula/markos.rb
#
# Homebrew tap formula for MarkOS — thin wrapper around the npm package.
# Pushed to markos/homebrew-tap repo per release CI (Plan 204-12).
# Users install via: `brew install markos/tap/markos`.
#
# Template pattern: https://docs.brew.sh/Node-for-Formula-Authors
# url + sha256 are rewritten per-release by scripts/distribution/bump-homebrew-formula.cjs.
class Markos < Formula
  desc "Marketing Operating System — developer-native CLI"
  homepage "https://markos.esteban.marketing"
  url "https://registry.npmjs.org/markos/-/markos-3.3.0.tgz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "MIT"

  # Floating Node LTS. Pinned major-version taps (e.g. node at major 22) have
  # a Homebrew deprecation date of 2026-10-28; bin/cli-runtime.cjs enforces
  # the >=22 floor at runtime via assertSupportedNodeVersion.
  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "markos", shell_output("#{bin}/markos --version")
  end
end
