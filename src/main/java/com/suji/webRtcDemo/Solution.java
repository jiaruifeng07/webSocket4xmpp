package com.suji.webRtcDemo;   /**
 * @Title: ${file_name}
 * @Package ${package_name}
 * @Description: ${todo}
 * @author jiaruifeng
 * @date 2018/7/27下午5:48
 */

/**

 * @author jiaruifeng

 * @create 2018-07-27 下午5:48

 * @desc

 **/
public class Solution {
    public static void main(String args[]){
        myAtoi("42");
        myAtoi("   -42");
        myAtoi("4193 with words");
        myAtoi("words and 987");
        myAtoi("-91283472332");
    }
    static int myAtoi(String str) {
        char[] aa=str.toCharArray();
        for(int i=0;i<aa.length;i++){
            int charVal=aa[i];
            if(charVal>=48&&charVal<57){
                System.out.print(charVal);
                System.out.print(" ");
            }
        }
        System.out.println("");
        return 0;
    }
}
