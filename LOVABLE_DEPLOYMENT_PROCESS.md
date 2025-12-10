# 🚀 Lovable Deployment Process - CRITICAL REFERENCE

## ⚠️ KEY LESSON LEARNED: December 10, 2025

**LOVABLE AUTO-DEPLOYS FROM THE `main` BRANCH ONLY!**

Pushing to feature branches does NOT trigger deployment in Lovable.

---

## ✅ CORRECT DEPLOYMENT PROCESS:

### Step 1: Work on Feature Branch
```bash
# Create and work on feature branch
git checkout -b cursor/feature-name
# Make changes, commit regularly
git add .
git commit -m "Description of changes"
git push origin cursor/feature-name
```

### Step 2: Merge to Main Branch (THIS IS THE KEY!)
```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge feature branch
git merge cursor/feature-name -m "Deploy: feature description"

# Push to main - THIS TRIGGERS LOVABLE DEPLOYMENT
git push origin main
```

### Step 3: Wait for Auto-Deployment
- Lovable detects push to main automatically
- Build starts within 30 seconds
- Deployment takes 1-3 minutes
- Check: https://lovable.dev/projects/aa42eecb-9312-4a65-8c1a-6d5d11ab9f61

---

## ❌ WHAT DOESN'T WORK:

1. **Pushing to feature branches** - Code is on GitHub but NOT deployed
2. **Only updating documentation** - Need actual code on main
3. **Assuming Lovable reads all branches** - It only reads main

---

## 🎯 QUICK DEPLOYMENT CHECKLIST:

- [ ] All changes committed to feature branch
- [ ] Switch to main: `git checkout main`
- [ ] Pull latest: `git pull origin main`
- [ ] Merge feature: `git merge cursor/feature-name`
- [ ] Push to main: `git push origin main` ← **THIS DEPLOYS!**
- [ ] Wait 1-3 minutes
- [ ] Verify in Lovable project

---

## 📋 COMPLETE EXAMPLE (Copy-Paste Ready):

```bash
# After finishing work on feature branch
cd /workspace

# Switch to main
git checkout main

# Get latest main
git pull origin main

# Merge your feature branch (replace with actual branch name)
git merge cursor/your-feature-branch -m "Deploy: your feature description"

# Push to main - THIS TRIGGERS DEPLOYMENT
git push origin main

# Done! Lovable will auto-deploy in 1-3 minutes
```

---

## 🔗 Key URLs:

**GitHub Repo**: https://github.com/factoreric123-sketch/exact-table-scan-0f83736a
**Lovable Project**: https://lovable.dev/projects/aa42eecb-9312-4a65-8c1a-6d5d11ab9f61

---

## 💡 REMEMBER:

> **"Lovable deploys from main. Always merge to main before expecting deployment."**

Feature branches are for development.
Main branch is for deployment.

---

*This document was created after successfully deploying the real-time sync feature on December 10, 2025.*
