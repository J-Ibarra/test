# Keep track of where Travis put us.
# We are on a detached head, and we need to be able to go back to it.
build_head=$(git rev-parse HEAD)

# Fetch the remote develop branch. Travis clones with `--depth`, which
# implies `--single-branch`, so we need to overwrite remote.origin.fetch to
# do that.
git config --replace-all remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
git fetch origin develop

# create the tacking branches (just develop for now)
git checkout develop

# finally, go back to where we were at the beginning
git checkout ${build_head}
