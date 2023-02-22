

///////////////////////////////////////Select Item//////////////////////////////////////////////////////////////////////////
function loadSI(contentXML) {

}


function updateSI() {
    //change dom value
    optionValue = quizContainer.querySelectorAll("input");
    for (let i = 0; i < optionValue.length; i++) {
        optionValue[i].setAttribute("value", optionValue[i].value);
    }
    let radios = quizContainer.querySelectorAll("input[type=radio]");
    for (let i = 0; i < radios.length; i++) {
        radios[i].checked ? radios[i].setAttribute("checked", true) : radios[i].removeAttribute("checked");
    }


    let quizzes = new DOMParser().parseFromString(quizContainer.innerHTML, "text/html")
    let quizzesArray = quizzes.querySelectorAll(".selectitem");
    let prefix = document.getElementById("prefix").value.trim();
    let listType = document.querySelector('#options').querySelector('input[name="listType"]:checked').nextElementSibling.innerHTML;
console.log(listType)
    prefix.trim().length>0 ? prefix=prefix+"_":prefix="";
    let data = "",
        content = "", rfv,
        isOptionImage = Boolean, keepNumbering = Boolean;
    document.getElementById("clue_keepNumbering").checked == true ? keepNumbering = true : keepNumbering = false;

    //loop through quizzes
    for (let i = 0; i < quizzesArray.length; i++) {
        let quiz = quizzesArray[i];
        //let clueText = quiz.querySelector("#clueText").getAttribute("value").trim();
        let clueText = quiz.querySelector(".ql-editor").innerHTML;
        clueText = clueText.replace('<p>', '').replace('</p>', '').replace(/<p><br[\/]?><[\/]?p>/g, '').replace(/<p>[\/]?<[\/]?p>/g, '').replace(/(&nbsp;|<br>|<br \/>)/gm, '').replace(/\>\s+\</g, '><'); //remove need <p> tags and numbering
        !keepNumbering ? clueText = clueText.replace(`${i + 1}.`, '') : "";

        let opt = "", values = [];

        //loop through options
        let options = quiz.querySelectorAll(".option");
        console.log(options)
        let correct = "";
        //add all option values in one array
        for (let j = 0; j < options.length; j++) {

            let opt_text = options[j].querySelector(".option_value").value.trim();
            let opt_radio = options[j].querySelector(".option_radio").value.trim();
            console.log(opt_radio)

            opt += `<asp:ListItem Value="${opt_radio}" Text="">${opt_text}</asp:ListItem>`
           // control += `<asp:CheckBox ID="${prefix}q${i + 1}_${j+1}" runat="server" Text="${opt_text}" Checked='<%# Bind("${prefix}q${i + 1}_${j+1}")%>' /> </ br>`
        }


        console.log(opt)
        document.getElementById("rfv").checked ? rfv = `<asp:RequiredFieldValidator ID="rfv_${prefix}q${i + 1}" runat="server" Display="Dynamic" ControlToValidate="${prefix}q${i + 1}" />` : rfv = "";
        let control=""
        switch(listType){
            case "RadioButtonList":
            control = `<asp:RadioButtonList ID="${prefix}q${i + 1}" runat="server" RepeatDirection="Horizontal" CssClass="emptyBorder" SelectedValue='<%# Bind("${prefix}q${i + 1}") %>'>
                                        ${opt}
                        </asp:RadioButtonList>`
            break;

            case "DropDownList":
            control = `<asp:DropDownList ID="${prefix}q${i + 1}" runat="server" RepeatDirection="Horizontal" CssClass="emptyBorder" SelectedValue='<%# Bind("${prefix}q${i + 1}") %>'>
                                        ${opt}
                        </asp:DropDownList>`
            break;

            case "TextBox":
            control = `<asp:TextBox ID="${prefix}q${i + 1}" runat="server" Width="30em" Text='<%# Bind("${prefix}q${i + 1}") %>' />`
            break;

            case "CheckBox":
                for (let j = 0; j < options.length; j++) {
                    let opt_text = options[j].querySelector(".option_value").value.trim();
        
                    control += `<asp:CheckBox ID="${prefix}q${i + 1}_${j+1}" runat="server" Text="${opt_text}" Checked='<%# Bind("${prefix}q${i + 1}_${j+1}")%>' /> </ br>`
                }
            break;
        }
        let frameContent = `<tr>
                                    <td class="firstCol">${clueText}</td>
                                    <td colspan="3">
                                    ${control}
                                    ${rfv}
                                    </td>
                                </tr>${"\n\n"}`;

        data += frameContent;
    } //end loop
    data = prettifyXml(data, { indent: 4 })
    console.log(data)

    return data;
} //end updateSI function


function dictionary(results) {
   
    results.map(row => {
        let field = ""
        let fieldType = row.FieldType
        console.log(fieldType)

        switch (fieldType) {
            case "text":
            case "notes":
                let rangeValidator = '';
                if (row.TextValidation == 'number') {
                    if (row.TextValidationMax.trim() && row.TextValidationMin.trim()) {
                        rangeValidator = `<asp:RangeValidator ID="rv_${row.FieldName}" runat="server" ControlToValidate="${row.FieldName}" ErrorMessage="Enter value ${row.TextValidationMin} to ${row.TextValidationMax}" ForeColor="Red" MaximumValue="${row.TextValidationMax}" MinimumValue="${row.TextValidationMin}"   
                         SetFocusOnError="True" Type="Integer"></asp:RangeValidator>`
                    }
                    field = `<asp:TextBox ID="${row.FieldName}" runat="server" CssClass="tb_AnswerValue" Rows="1" Text='<%# Bind("${row.FieldName}") %>'></asp:TextBox>\n${rangeValidator}`;
                    updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                    updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="Int16" />\n`;
                    sqlParameters += `[${row.FieldName}] int NULL,\n`;

                } else if (row.TextValidation.trim().includes("date")) {
                    field = `<asp:TextBox ID="${row.FieldName}" runat="server" CssClass="tb_AnswerValue dtpSelector" Rows="1" Text='<%# Bind("${row.FieldName}", "{0:d}") %>'></asp:TextBox>`;
                    updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                    updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="DateTime" />\n`;
                    sqlParameters += `[${row.FieldName}] [smalldatetime] NULL,\n`;

                } else {
                    field = `<asp:TextBox ID="${row.FieldName}" runat="server" CssClass="tb_AnswerValue" Rows="3" TextMode="MultiLine" Text='<%# Bind("${row.FieldName}") %>'></asp:TextBox>`;
                    updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                    updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="String" />\n`;
                    sqlParameters += `[${row.FieldName}] varchar(255) NULL,\n`;
                }

                break;

            case "calc":
                field = `<asp:TextBox ID="${row.FieldName}" CssClass="calc_AnswerValue" runat="server" Rows="1" Text='<%# Bind("${row.FieldName}") %>'></asp:TextBox>`;
                updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="Decimal" />\n`;
                sqlParameters += `[${row.FieldName}] Decimal NULL,\n`;
                break;

            case "yesno":
                field = `
                         <asp:DropDownList ID="ddl_${row.FieldName}" CssClass="ddl_AnswerValue" runat="server" SelectedValue='<%# Bind("${row.FieldName}") %>'>
                             <asp:ListItem Value=""> -- </asp:ListItem>
                             <asp:ListItem Value="0">0. No</asp:ListItem>
                             <asp:ListItem Value="1">1. Yes</asp:ListItem>
                             <asp:ListItem Value="-3">-3. N/A</asp:ListItem>
                             <asp:ListItem Value="-9">-9. Missing data</asp:ListItem>
                         </asp:DropDownList>`;
                field = prettifyXml(field);
                updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="Int16" />\n`;
                sqlParameters += `[${row.FieldName}] int NULL,\n`;
                break;

            case "radio":
            case "dropdown":
                let opt = row.Choices.split("|");
                field = `
                         <asp:DropDownList ID="ddl_${row.FieldName}" CssClass="ddl_AnswerValue" runat="server" SelectedValue='<%# Bind("${row.FieldName}") %>'>
                         <asp:ListItem Value=""> -- </asp:ListItem>
                             ${opt.map(op => {
                    let listNumbering = op.substr(0, op.indexOf(","))
                    let listText = op.substring(op.indexOf(",") + 1)
                    // console.log(listNumbering+ " : " +listText)
                    return `<asp:ListItem Value="${listNumbering.trim()}">${listNumbering.trim()}. ${listText.trim()}</asp:ListItem>`
                }).join("\n")
                    }
                         <asp:ListItem Value="-3">-3. N/A</asp:ListItem>
                         <asp:ListItem Value="-9">-9. Missing data</asp:ListItem>
                         </asp:DropDownList>`;
                field = prettifyXml(field, { indent: 3 });
                updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="Int16" />\n`;
                sqlParameters += `[${row.FieldName}] int NULL,\n`;
                break;

            case "checkbox":
                if (row.Choices.includes("|")) {
                    let opt = row.Choices.split("|");
                    field = `
                         ${opt.map((op, i) => {
                        let listNumbering = op.substr(0, op.indexOf(",")).trim();
                        let listText = op.substring(op.indexOf(",") + 1).trim();
                        updateCommand += `,${row.FieldName}_${listNumbering} = @${row.FieldName}_${listNumbering}\n`;
                        updateParameters += `<asp:Parameter Name="${row.FieldName}_${listNumbering}" Type="Boolean" />\n`;
                        sqlParameters += `[${row.FieldName}_${listNumbering}] bit NULL,\n`;
                        return `<asp:CheckBox ID="cb_${row.FieldName}_${listNumbering}" runat="server" Text="${listText}" Checked='<%# Bind("${row.FieldName}_${listNumbering}")%>' />`
                    }).join("\n")
                        }`
                } else {
                    field = `<asp:CheckBox ID="cb_${row.FieldName}" runat="server" Text="${row.Choices}" Checked='<%# Bind("${row.FieldName}")%>' />`;
                    updateCommand += `,${row.FieldName} = @${row.FieldName}\n`;
                    updateParameters += `<asp:Parameter Name="${row.FieldName}" Type="Boolean" />\n`;
                    sqlParameters += `[${row.FieldName}] bit NULL,\n`;
                }

                break;

            case "descriptive":
                field = `<asp:Label ID="label_${row.FieldName}" CssClass="label_AnswerValue" runat="server"  Text='${row.FieldLabel}' />`;
                break;
            default:
            // code block
        }
        //console.log(field)  

        row.SectionHeader.trim() ? sectionHeader = `<tr class="${row.FormName}"><td colspan="6"><div class="sectionHeader">${row.SectionHeader}</div></td></tr>\n` : sectionHeader = "";  //add section header if it's in csv file   
        row.FieldNote.trim() ? fieldNote = `<br><small>${row.FieldNote.trim()}</small>` : fieldNote = ""

        if (fieldType == "descriptive") {
            tr += `${sectionHeader}<tr class="${row.FormName}">
             <td colspan="6">
             <span class="lbl_QuestionText" style="display:inline-block;width:100%;">${row.FieldLabel}</span><br>
             <span class="lbl_FieldName" readonly="true">${row.FieldName}</span><br>
             <span class="lbl_BranchingLogic" readonly="true">${row.BranchingLogic}</span> 
             </td>
         </tr> \n`;
        } else {
            tr += `${sectionHeader}<tr class="${row.FormName}">
                 <td class="question-column">
                 <span class="lbl_QuestionText" style="display:inline-block;width:100%;">${row.FieldLabel}</span><br>
                 <span class="lbl_FieldName" readonly="true">${row.FieldName}</span><br>
                 <span class="lbl_BranchingLogic" readonly="true">${row.BranchingLogic}</span>
                 
                 </td>
                     <td class="answer-column">
                     <span class="lbl_Choices">${row.FieldType == 'calc' ? row.Choices : ""}</span>
                     ${field}  ${fieldNote}
                 </td>
             </tr> \n`;
            // sectionHeader="", fieldNote=''
        }
    });
    //console.log(tr)
    return tr
}