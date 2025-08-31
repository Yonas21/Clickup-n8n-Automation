# ClickUp Backup Testing Guide

## 🧪 **How to Test Your ClickUp Backup System**

### **1. Test API Connection**
```bash
npm run test-api
```
**What it tests:**
- ✅ ClickUp API authentication
- ✅ User information retrieval
- ✅ Team information
- ✅ Spaces listing
- ✅ Individual space data (folders, lists, sprints)

**Expected output:**
- Your username and email
- Team name
- List of all spaces
- Data counts for each space

---

### **2. Test Backup Components**
```bash
npm run test-components
```
**What it tests:**
- ✅ All backup functions individually
- ✅ Data retrieval for each component
- ✅ Backup data formatting
- ✅ Markdown generation

**Expected output:**
- Component-by-component test results
- Data counts and formatting preview
- Confirmation that all parts work

---

### **3. Test Single Space Backup**
```bash
npm run test-single
```
**What it tests:**
- ✅ Interactive space selection
- ✅ Complete backup for one space
- ✅ File creation and saving
- ✅ Both JSON and Markdown output

**Expected output:**
- List of available spaces
- Interactive selection prompt
- Backup creation for selected space
- File paths for created backups

---

### **4. Test Full Backup**
```bash
npm run backup-local
```
**What it tests:**
- ✅ Complete backup of all spaces
- ✅ All data types (folders, lists, tasks, sprints)
- ✅ File creation and organization
- ✅ Cleanup of old backups

**Expected output:**
- Progress for each space
- File creation confirmations
- Summary statistics
- Backup location information

---

## 📊 **What to Look For**

### **✅ Success Indicators:**
- No authentication errors
- Data retrieved successfully
- Files created in `/backups` folder
- Markdown files are readable
- JSON files contain structured data

### **⚠️ Normal Warnings:**
- 404 errors for sprints (not all spaces have sprints enabled)
- Some spaces may have 0 lists or tasks

### **❌ Error Indicators:**
- Authentication failures
- Network connection issues
- File system permission errors
- Missing environment variables

---

## 🔍 **Manual Testing Steps**

### **1. Check Your Credentials**
```bash
# Verify your .env file has:
CLICKUP_API_TOKEN=your_token_here
CLICKUP_TEAM_ID=your_team_id_here
```

### **2. Verify Backup Files**
After running a backup, check:
```bash
ls -la backups/
```
You should see:
- `.json` files (raw data)
- `.md` files (readable reports)

### **3. Open a Markdown File**
```bash
open backups/clickup-backup-[SpaceName]-[timestamp].md
```
This should open a beautifully formatted report.

### **4. Check JSON Data**
```bash
head -20 backups/clickup-backup-[SpaceName]-[timestamp].json
```
This should show structured JSON data.

---

## 🚀 **Advanced Testing**

### **Test with Different Spaces**
Some spaces have different data structures:
- **Spaces with folders** - Test folder organization
- **Spaces with lists** - Test list and task retrieval
- **Spaces with sprints** - Test sprint data (if enabled)

### **Test Data Integrity**
1. Run backup twice and compare file sizes
2. Check that all expected data is present
3. Verify timestamps are current

### **Test Error Handling**
1. Temporarily break your API token
2. Run tests to see error messages
3. Restore token and verify recovery

---

## 📋 **Testing Checklist**

- [ ] API connection works
- [ ] All spaces are accessible
- [ ] Folders are retrieved correctly
- [ ] Lists are retrieved correctly
- [ ] Tasks are retrieved correctly
- [ ] Sprints are handled gracefully (404s are normal)
- [ ] JSON files are created
- [ ] Markdown files are created
- [ ] Files are saved to correct location
- [ ] Old backups are cleaned up
- [ ] Error handling works properly

---

## 🎯 **Quick Test Commands**

```bash
# Test everything quickly
npm run test-api && npm run test-components && npm run backup-local

# Test just the API
npm run test-api

# Test a single space
npm run test-single

# Run full backup
npm run backup-local
```

---

## 📞 **Troubleshooting**

### **If tests fail:**
1. Check your `.env` file
2. Verify your ClickUp API token
3. Check your internet connection
4. Ensure you have write permissions in the project directory

### **If data seems incomplete:**
1. Some spaces may not have all data types
2. Sprints are optional and may return 404 errors
3. Check your ClickUp permissions

### **If files aren't created:**
1. Check directory permissions
2. Ensure the `backups` folder can be created
3. Verify disk space is available

---

**Happy Testing! 🎉**