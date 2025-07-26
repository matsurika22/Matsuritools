#!/bin/bash

echo "GitHubリポジトリ名変更後に実行してください"
echo "現在のリモートURL:"
git remote -v

echo ""
echo "新しいリモートURLに更新します..."
git remote set-url origin https://github.com/matsurika22/matsuritools.git

echo ""
echo "更新後のリモートURL:"
git remote -v

echo ""
echo "✅ リモートURLの更新が完了しました"