<%@ Page Language="C#" %>

<%@ Register Assembly="Ext.Net" Namespace="Ext.Net" TagPrefix="ext" %>

<script runat="server">
    protected void ActivateClick(object sender, DirectEventArgs e)
    {
        Debug.Activate(DebugConsole.Firebug, new JFunction("Ext.net.Debug.show();"));
    }
</script>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" 
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Firebug Debug Console - Ext.NET Examples</title>    
    <link href="../../../../resources/css/examples.css" rel="stylesheet" type="text/css" />
</head>
<body>
    <form runat="server">
        <ext:ResourceManager runat="server" />
        
        <ext:Viewport runat="server" Layout="Fit">
            <Items>
                <ext:Panel runat="server" Border="false" Layout="Absolute">
                    <TopBar>
                        <ext:Toolbar runat="server">
                            <Items>
                                <ext:Button runat="server" Text="Activate Console" OnDirectClick="ActivateClick" />
                            </Items>
                        </ext:Toolbar>
                    </TopBar>
                    <Items>
                        <ext:Panel 
                            ID="Panel1" 
                            runat="server" 
                            Title="Sample Form" 
                            Height="185" 
                            Width="350"
                            Frame="true"
                            Layout="Form"
                            X="50"
                            Y="50">
                            <Items>
                                <ext:TextField 
                                    ID="TextField1" 
                                    runat="server" 
                                    FieldLabel="TextField1" 
                                    AnchorHorizontal="100%"
                                    />
                                <ext:TextField 
                                    ID="TextField2" 
                                    runat="server" 
                                    FieldLabel="TextField2" 
                                    AnchorHorizontal="100%" 
                                    />
                                <ext:DateField
                                    ID="DateField1"
                                    runat="server"
                                    FieldLabel="DateField1"
                                    AnchorHorizontal="100%"
                                    />
                            </Items>
                            <Buttons>
                                <ext:Button ID="Button1" runat="server" Text="Button1" Icon="Disk">
                                    <Listeners>
                                        <Click Handler="Ext.Msg.alert('Message', 'Just some fields to test the debug console with.');" />
                                    </Listeners>
                                </ext:Button>
                            </Buttons>
                        </ext:Panel>
                    </Items>
                </ext:Panel>
            </Items>
        </ext:Viewport>
    </form>    
</body>
</html>