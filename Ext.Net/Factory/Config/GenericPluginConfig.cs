/********
 * This file is part of Ext.NET.
 *     
 * Ext.NET is free software: you can redistribute it and/or modify
 * it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE as 
 * published by the Free Software Foundation, either version 3 of the 
 * License, or (at your option) any later version.
 * 
 * Ext.NET is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 * 
 * You should have received a copy of the GNU AFFERO GENERAL PUBLIC LICENSE
 * along with Ext.NET.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * @version   : 1.2.0 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2011-09-12
 * @copyright : Copyright (c) 2006-2011, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : GNU AFFERO GENERAL PUBLIC LICENSE (AGPL) 3.0. 
 *              See license.txt and http://www.ext.net/license/.
 *              See AGPL License at http://www.gnu.org/licenses/agpl-3.0.txt
 ********/

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Ext.Net
{
    public partial class GenericPlugin
    {
		/*  Ctor
			-----------------------------------------------------------------------------------------------*/

        /// <summary>
        /// 
        /// </summary>
        public GenericPlugin(Config config)
        {
            this.Apply(config);
        }


		/*  Implicit GenericPlugin.Config Conversion to GenericPlugin
			-----------------------------------------------------------------------------------------------*/

        /// <summary>
        /// 
        /// </summary>
        public static implicit operator GenericPlugin(GenericPlugin.Config config)
        {
            return new GenericPlugin(config);
        }
        
        /// <summary>
        /// 
        /// </summary>
        new public partial class Config : Plugin.Config 
        { 
			/*  Implicit GenericPlugin.Config Conversion to GenericPlugin.Builder
				-----------------------------------------------------------------------------------------------*/
        
            /// <summary>
			/// 
			/// </summary>
			public static implicit operator GenericPlugin.Builder(GenericPlugin.Config config)
			{
				return new GenericPlugin.Builder(config);
			}
			
			
			/*  ConfigOptions
				-----------------------------------------------------------------------------------------------*/
			
			private string instanceName = "";

			/// <summary>
			/// The JavaScript class name. Used to create a 'new' instance of the object.
			/// </summary>
			[DefaultValue("")]
			public virtual string InstanceName 
			{ 
				get
				{
					return this.instanceName;
				}
				set
				{
					this.instanceName = value;
				}
			}

			private string path = "";

			/// <summary>
			/// The file path to the required JavaScript file.
			/// </summary>
			[DefaultValue("")]
			public virtual string Path 
			{ 
				get
				{
					return this.path;
				}
				set
				{
					this.path = value;
				}
			}

        }
    }
}